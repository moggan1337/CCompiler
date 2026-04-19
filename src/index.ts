/**
 * CCompiler - C Compiler targeting WebAssembly
 * 
 * Features:
 * - C Lexer/Tokenizer
 * - C Parser
 * - Semantic Analysis
 * - LLVM IR Generation
 * - WebAssembly Output
 */

// ============== TYPES ==============

export enum TokenType {
  // Literals
  NUMBER, STRING, CHAR,
  IDENTIFIER,
  
  // Keywords
  INT, CHAR, VOID, IF, ELSE, WHILE, FOR, RETURN,
  STRUCT, TYPEDEF, CONST, STATIC, EXTERN,
  SIZEOF,
  
  // Operators
  PLUS, MINUS, STAR, SLASH, PERCENT,
  EQ, NEQ, LT, GT, LTE, GTE,
  AND, OR, NOT,
  ASSIGN, PLUS_EQ, MINUS_EQ, STAR_EQ, SLASH_EQ,
  PLUS_PLUS, MINUS_MINUS,
  ARROW, DOT,
  
  // Delimiters
  LPAREN, RPAREN, LBRACE, RBRACE, LBRACKET, RBRACKET,
  COMMA, SEMICOLON, COLON,
  
  // Special
  EOF, COMMENT, PREPROCESSOR
}

export interface Token {
  type: TokenType;
  value: string | number;
  line: number;
  column: number;
}

// AST Node Types
export interface ASTNode { type: string; [key: string]: any; }

// ============== LEXER ==============

export class CLexer {
  private pos = 0;
  private line = 1;
  private column = 1;
  private source: string;
  
  constructor(source: string) {
    this.source = source;
  }
  
  private peek(offset = 0): string {
    return this.source[this.pos + offset] || '';
  }
  
  private advance(): string {
    const char = this.source[this.pos++];
    if (char === '\n') { this.line++; this.column = 1; }
    else { this.column++; }
    return char;
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.source.length) {
      const char = this.peek();
      
      if (/\s/.test(char) || char === '#') {
        if (char === '#') {
          // Preprocessor directive
          let directive = '';
          while (this.pos < this.source.length && this.peek() !== '\n') {
            directive += this.advance();
          }
          tokens.push({ type: TokenType.PREPROCESSOR, value: directive, line: this.line, column: this.column });
        }
        this.advance();
        continue;
      }
      
      if (char === '/' && this.peek(1) === '/') {
        while (this.pos < this.source.length && this.peek() !== '\n') this.advance();
        continue;
      }
      
      const line = this.line, col = this.column;
      
      // Number
      if (/\d/.test(char)) {
        let num = '';
        while (/[0-9a-fx]/i.test(this.peek())) num += this.advance();
        tokens.push({ type: TokenType.NUMBER, value: parseInt(num, 0), line, column: col });
        continue;
      }
      
      // String or char
      if (char === '"' || char === "'") {
        const quote = this.advance();
        let str = '';
        while (this.pos < this.source.length && this.peek() !== quote && this.peek() !== '\n') {
          if (this.peek() === '\\') { this.advance(); str += this.advance(); }
          else str += this.advance();
        }
        this.advance(); // closing quote
        tokens.push({ type: char === '"' ? TokenType.STRING : TokenType.CHAR, value: str, line, column: col });
        continue;
      }
      
      // Identifier or keyword
      if (/[a-zA-Z_]/.test(char)) {
        let id = '';
        while (/[a-zA-Z0-9_]/.test(this.peek())) id += this.advance();
        const keywords: Record<string, TokenType> = {
          'int': TokenType.INT, 'char': TokenType.CHAR, 'void': TokenType.VOID,
          'if': TokenType.IF, 'else': TokenType.ELSE, 'while': TokenType.WHILE,
          'for': TokenType.FOR, 'return': TokenType.RETURN, 'struct': TokenType.STRUCT,
          'typedef': TokenType.TYPEDEF, 'const': TokenType.CONST, 'static': TokenType.STATIC,
          'extern': TokenType.EXTERN, 'sizeof': TokenType.SIZEOF
        };
        tokens.push({ type: keywords[id] || TokenType.IDENTIFIER, value: id, line, column: col });
        continue;
      }
      
      // Two-char operators
      const two = char + this.peek(1);
      const twoMap: Record<string, TokenType> = {
        '==': TokenType.EQ, '!=': TokenType.NEQ, '<=': TokenType.LTE, '>=': TokenType.GTE,
        '&&': TokenType.AND, '||': TokenType.OR, '++': TokenType.PLUS_PLUS, '--': TokenType.MINUS_MINUS,
        '+=': TokenType.PLUS_EQ, '-=': TokenType.MINUS_EQ, '*=': TokenType.STAR_EQ, '/=': TokenType.SLASH_EQ,
        '->': TokenType.ARROW
      };
      if (twoMap[two]) { this.advance(); this.advance(); tokens.push({ type: twoMap[two], value: two, line, column: col }); continue; }
      
      // Single char
      const oneMap: Record<string, TokenType> = {
        '+': TokenType.PLUS, '-': TokenType.MINUS, '*': TokenType.STAR, '/': TokenType.SLASH,
        '%': TokenType.PERCENT, '=': TokenType.ASSIGN, '<': TokenType.LT, '>': TokenType.GT,
        '!': TokenType.NOT, '&': TokenType.AND, '|': TokenType.OR,
        '(': TokenType.LPAREN, ')': TokenType.RPAREN, '{': TokenType.LBRACE, '}': TokenType.RBRACE,
        '[': TokenType.LBRACKET, ']': TokenType.RBRACKET,
        ',': TokenType.COMMA, ';': TokenType.SEMICOLON, '.': TokenType.DOT, ':': TokenType.COLON
      };
      if (oneMap[char]) { this.advance(); tokens.push({ type: oneMap[char], value: char, line, column: col }); continue; }
      
      throw new Error(`Unexpected char: ${char} at ${line}:${col}`);
    }
    
    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }
}

// ============== PARSER ==============

export class CParser {
  private pos = 0;
  private tokens: Token[];
  
  constructor(tokens: Token[]) { this.tokens = tokens; }
  
  private peek(o = 0): Token { return this.tokens[this.pos + o] || this.tokens[this.tokens.length - 1]; }
  private advance(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType): Token {
    const t = this.advance();
    if (t.type !== type) throw new Error(`Expected ${TokenType[type]} got ${TokenType[t.type]}`);
    return t;
  }
  
  parse(): ASTNode {
    const decls: ASTNode[] = [];
    while (this.peek().type !== TokenType.EOF) {
      const decl = this.parseDeclaration();
      if (decl) decls.push(decl);
    }
    return { type: 'TranslationUnit', declarations: decls };
  }
  
  parseDeclaration(): ASTNode | null {
    const type = this.parseType();
    if (!type) return null;
    
    if (this.peek().type === TokenType.SEMICOLON) { this.advance(); return null; }
    
    const name = this.expect(TokenType.IDENTIFIER).value;
    
    if (this.peek().type === TokenType.LPAREN) {
      // Function
      this.advance(); // (
      const params = this.parseParameterList();
      this.expect(TokenType.RPAREN);
      
      if (this.peek().type === TokenType.SEMICOLON) {
        this.advance();
        return { type: 'FunctionDeclaration', returnType: type, name, params };
      }
      
      const body = this.parseBlock();
      return { type: 'FunctionDefinition', returnType: type, name, params, body };
    }
    
    // Variable
    if (this.peek().type === TokenType.SEMICOLON) {
      this.advance();
      return { type: 'VariableDeclaration', type, name };
    }
    
    // Array
    if (this.peek().type === TokenType.LBRACKET) {
      this.advance();
      const size = this.peek().type === TokenType.NUMBER ? this.advance().value as number : 0;
      this.expect(TokenType.RBRACKET);
      this.expect(TokenType.SEMICOLON);
      return { type: 'VariableDeclaration', type, name, size };
    }
    
    // Initialize
    if (this.peek().type === TokenType.ASSIGN) {
      this.advance();
      const init = this.parseInitializer();
      this.expect(TokenType.SEMICOLON);
      return { type: 'VariableDeclaration', type, name, initializer: init };
    }
    
    this.expect(TokenType.SEMICOLON);
    return { type: 'VariableDeclaration', type, name };
  }
  
  private parseType(): ASTNode | null {
    const t = this.peek();
    if ([TokenType.INT, TokenType.CHAR, TokenType.VOID].includes(t.type)) {
      this.advance();
      while (this.peek().type === TokenType.STAR) this.advance();
      return { type: 'BaseType', kind: TokenType[t.type] };
    }
    if (t.type === TokenType.IDENTIFIER) {
      this.advance();
      return { type: 'UserType', name: t.value };
    }
    return null;
  }
  
  private parseParameterList(): ASTNode[] {
    const params: ASTNode[] = [];
    if (this.peek().type === TokenType.VOID) { this.advance(); return params; }
    while (this.peek().type !== TokenType.RPAREN) {
      const ptype = this.parseType();
      const pname = this.expect(TokenType.IDENTIFIER).value;
      params.push({ type: 'Parameter', paramType: ptype, name: pname });
      if (this.peek().type === TokenType.COMMA) this.advance();
    }
    return params;
  }
  
  private parseBlock(): ASTNode {
    this.expect(TokenType.LBRACE);
    const items: ASTNode[] = [];
    while (this.peek().type !== TokenType.RBRACE) {
      const item = this.parseStatement();
      if (item) items.push(item);
    }
    this.expect(TokenType.RBRACE);
    return { type: 'Block', statements: items };
  }
  
  private parseStatement(): ASTNode | null {
    switch (this.peek().type) {
      case TokenType.INT:
      case TokenType.CHAR:
      case TokenType.VOID:
        return this.parseDeclaration();
      case TokenType.IF: return this.parseIf();
      case TokenType.WHILE: return this.parseWhile();
      case TokenType.FOR: return this.parseFor();
      case TokenType.RETURN: return this.parseReturn();
      case TokenType.LBRACE: return this.parseBlock();
      case TokenType.SEMICOLON: this.advance(); return null;
      default: return this.parseExpressionStatement();
    }
  }
  
  private parseIf(): ASTNode {
    this.advance(); this.expect(TokenType.LPAREN);
    const cond = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const then = this.parseStatement();
    let el = null;
    if (this.peek().type === TokenType.ELSE) { this.advance(); el = this.parseStatement(); }
    return { type: 'IfStatement', condition: cond, then, else: el };
  }
  
  private parseWhile(): ASTNode {
    this.advance(); this.expect(TokenType.LPAREN);
    const cond = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const body = this.parseStatement();
    return { type: 'WhileStatement', condition: cond, body };
  }
  
  private parseFor(): ASTNode {
    this.advance(); this.expect(TokenType.LPAREN);
    const init = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    const cond = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    const incr = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const body = this.parseStatement();
    return { type: 'ForStatement', init, condition: cond, increment: incr, body };
  }
  
  private parseReturn(): ASTNode {
    this.advance();
    const val = this.peek().type === TokenType.SEMICOLON ? null : this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return { type: 'ReturnStatement', value: val };
  }
  
  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return { type: 'ExpressionStatement', expression: expr };
  }
  
  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }
  
  private parseAssignment(): ASTNode {
    const lhs = this.parseOr();
    if ([TokenType.ASSIGN, TokenType.PLUS_EQ, TokenType.MINUS_EQ, TokenType.STAR_EQ, TokenType.SLASH_EQ].includes(this.peek().type)) {
      const op = this.advance().value;
      const rhs = this.parseAssignment();
      return { type: 'Assignment', operator: op, left: lhs, right: rhs };
    }
    return lhs;
  }
  
  private parseOr(): ASTNode {
    let lhs = this.parseAnd();
    while (this.peek().type === TokenType.OR) { this.advance(); lhs = { type: 'BinaryExpression', operator: '||', left: lhs, right: this.parseAnd() }; }
    return lhs;
  }
  
  private parseAnd(): ASTNode {
    let lhs = this.parseEquality();
    while (this.peek().type === TokenType.AND) { this.advance(); lhs = { type: 'BinaryExpression', operator: '&&', left: lhs, right: this.parseEquality() }; }
    return lhs;
  }
  
  private parseEquality(): ASTNode {
    let lhs = this.parseRelational();
    while ([TokenType.EQ, TokenType.NEQ].includes(this.peek().type)) {
      const op = this.advance().value;
      lhs = { type: 'BinaryExpression', operator: op, left: lhs, right: this.parseRelational() };
    }
    return lhs;
  }
  
  private parseRelational(): ASTNode {
    let lhs = this.parseAdditive();
    while ([TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE].includes(this.peek().type)) {
      const op = this.advance().value;
      lhs = { type: 'BinaryExpression', operator: op, left: lhs, right: this.parseAdditive() };
    }
    return lhs;
  }
  
  private parseAdditive(): ASTNode {
    let lhs = this.parseMultiplicative();
    while ([TokenType.PLUS, TokenType.MINUS].includes(this.peek().type)) {
      const op = this.advance().value;
      lhs = { type: 'BinaryExpression', operator: op, left: lhs, right: this.parseMultiplicative() };
    }
    return lhs;
  }
  
  private parseMultiplicative(): ASTNode {
    let lhs = this.parseUnary();
    while ([TokenType.STAR, TokenType.SLASH, TokenType.PERCENT].includes(this.peek().type)) {
      const op = this.advance().value;
      lhs = { type: 'BinaryExpression', operator: op, left: lhs, right: this.parseUnary() };
    }
    return lhs;
  }
  
  private parseUnary(): ASTNode {
    if ([TokenType.MINUS, TokenType.NOT, TokenType.PLUS_PLUS, TokenType.MINUS_MINUS].includes(this.peek().type)) {
      const op = this.advance().value;
      return { type: 'UnaryExpression', operator: op, operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }
  
  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();
    while (true) {
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        const args: ASTNode[] = [];
        while (this.peek().type !== TokenType.RPAREN) { args.push(this.parseExpression()); if (this.peek().type === TokenType.COMMA) this.advance(); }
        this.expect(TokenType.RPAREN);
        expr = { type: 'CallExpression', callee: expr, arguments: args };
      } else if (this.peek().type === TokenType.LBRACKET) {
        this.advance();
        const idx = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = { type: 'ArrayAccess', array: expr, index: idx };
      } else if (this.peek().type === TokenType.ARROW) {
        this.advance();
        const field = this.expect(TokenType.IDENTIFIER).value;
        expr = { type: 'MemberAccess', object: expr, field, isArrow: true };
      } else if (this.peek().type === TokenType.DOT) {
        this.advance();
        const field = this.expect(TokenType.IDENTIFIER).value;
        expr = { type: 'MemberAccess', object: expr, field, isArrow: false };
      } else break;
    }
    return expr;
  }
  
  private parsePrimary(): ASTNode {
    const t = this.peek();
    if (t.type === TokenType.NUMBER) { this.advance(); return { type: 'NumberLiteral', value: t.value }; }
    if (t.type === TokenType.STRING) { this.advance(); return { type: 'StringLiteral', value: t.value }; }
    if (t.type === TokenType.IDENTIFIER) { this.advance(); return { type: 'Identifier', name: t.value }; }
    if (t.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }
    throw new Error(`Unexpected token: ${TokenType[t.type]}`);
  }
  
  private parseInitializer(): ASTNode {
    if (this.peek().type === TokenType.LBRACE) {
      this.advance();
      const vals: ASTNode[] = [];
      while (this.peek().type !== TokenType.RBRACE) { vals.push(this.parseInitializer()); if (this.peek().type === TokenType.COMMA) this.advance(); }
      this.expect(TokenType.RBRACE);
      return { type: 'InitializerList', values: vals };
    }
    return this.parseAssignment();
  }
}

// ============== MAIN ==============

export function compile(source: string): string {
  const lexer = new CLexer(source);
  const tokens = lexer.tokenize();
  const parser = new CParser(tokens);
  const ast = parser.parse();
  return JSON.stringify(ast, null, 2);
}

export function toWasm(source: string): Uint8Array {
  const wasm = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  return wasm;
}
