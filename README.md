# CCompiler 🔧

**A C Compiler targeting WebAssembly - Learn Compiler Design**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## Overview

CCompiler is a C compiler demonstrating the complete compilation pipeline:

1. **Lexer** - Tokenizes C source code
2. **Parser** - Recursive descent parser building an AST
3. **Semantic Analysis** - Type checking and validation
4. **Code Generation** - LLVM IR and WebAssembly output

## Why Build a C Compiler?

- **Learn Compilation Theory** - See automata, parsing, IR generation
- **Understand C** - Deep dive into the language spec
- **WebAssembly** - Target the future of the web
- **Fundamentals** - Compilers are the foundation of CS

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CCompiler Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   C Source Code                                              │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    LEXER                              │   │
│   │  - Tokenize keywords, operators, literals            │   │
│   │  - Handle preprocessor directives (#include, #define)│   │
│   │  - Track line/column for error reporting           │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    PARSER                             │   │
│   │  - Recursive descent parsing                        │   │
│   │  - Handle C operator precedence                     │   │
│   │  - Build AST with proper node types                 │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              SEMANTIC ANALYSIS                       │   │
│   │  - Type checking                                    │   │
│   │  - Symbol table management                          │   │
│   │  - Scope resolution                                │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 LLVM IR GENERATION                   │   │
│   │  - Convert AST to LLVM Intermediate Representation  │   │
│   │  - Generate type declarations                        │   │
│   │  - Generate function bodies                         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              WEBASSEMBLY EMISSION                    │   │
│   │  - Convert LLVM IR to WebAssembly bytecode          │   │
│   │  - Generate valid WASM module                       │   │
│   │  - Emit type and function sections                  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## C Language Features Supported

### Data Types

| Type | Example | Size |
|------|---------|------|
| `int` | `42` | 4 bytes |
| `char` | `'A'` | 1 byte |
| `void` | (return type) | - |
| `int*` | `&x` | pointer |
| `int[]` | `arr[10]` | array |

### Control Flow

```c
// If/Else
if (x > 10) {
    x = x - 1;
} else {
    x = 0;
}

// While
while (x > 0) {
    x--;
}

// For
for (int i = 0; i < 10; i++) {
    sum += i;
}
```

### Functions

```c
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    return factorial(5);
}
```

### Pointers and Arrays

```c
int* ptr = &x;
int arr[10];
int val = arr[5];
```

### Structures

```c
struct Point {
    int x;
    int y;
};

struct Point p = {10, 20};
```

## Installation

```bash
npm install ccompiler
```

Or from source:

```bash
git clone https://github.com/moggan1337/CCompiler.git
cd CCompiler
npm install
npm run build
```

## Quick Start

### Compile to AST

```typescript
import { compile } from 'ccompiler';

const source = `
int add(int a, int b) {
    return a + b;
}

int main() {
    return add(2, 3);
}
`;

const ast = compile(source);
console.log(JSON.stringify(ast, null, 2));
```

### Generate WebAssembly

```typescript
import { toWasm } from 'ccompiler';

const source = `
int double(int x) {
    return x * 2;
}

int main() {
    return double(21);
}
`;

const wasm = toWasm(source);
console.log('WASM bytes:', wasm);
```

## Compilation Pipeline

### 1. Lexical Analysis (Lexer)

```
Source: "int x = 42;"
        │
        ▼
Tokens: [
  { type: INT, value: 'int', line: 1 },
  { type: IDENTIFIER, value: 'x', line: 1 },
  { type: '=', value: '=', line: 1 },
  { type: NUMBER, value: 42, line: 1 },
  { type: ';', value: ';', line: 1 }
]
```

### 2. Parsing (Parser)

```
Tokens
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Syntax Analysis                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Program                                                     │
│    └─► FunctionDeclaration: "add"                          │
│          ├─► Parameter: (a: int)                           │
│          ├─► Parameter: (b: int)                           │
│          └─► Body                                           │
│                └─► ReturnStatement                          │
│                      └─► BinaryExpression: a + b              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Semantic Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                   Type Checking                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Expression: a + b                                           │
│  ├─► Left operand: a (type: int)                          │
│  ├─► Operator: +                                            │
│  └─► Right operand: b (type: int)                           │
│                                                              │
│  Result: int (valid)                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Code Generation

```
┌─────────────────────────────────────────────────────────────┐
│                   IR Generation                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  define i32 @add(i32 %a, i32 %b) {                         │
│  entry:                                                    │
│    %result = add i32 %a, %b                                │
│    ret i32 %result                                          │
│  }                                                          │
│                                                              │
│  define i32 @main() {                                      │
│  entry:                                                    │
│    %0 = call i32 @add(i32 2, i32 3)                        │
│    ret i32 %0                                              │
│  }                                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Supported Syntax

### Declarations

```c
int x;                    // Variable
int x = 42;               // Initialized
int arr[10];              // Array
int* ptr;                 // Pointer
const int MAX = 100;     // Constant
static int count;        // Static
extern int global;      // External
```

### Expressions

```c
x + y * z               // Precedence
(x + y) * z             // Grouping
a == b                   // Comparison
ptr->field               // Arrow operator
arr[i]                   // Array access
&x                       // Address-of
*p                        // Dereference
```

### Statements

```c
if (cond) { } else { }
while (cond) { }
for (init; cond; incr) { }
return expr;
expr;                     // Expression statement
{ decl; decl; }           // Compound
```

## Token Types

```typescript
enum TokenType {
  // Literals
  NUMBER, STRING, CHAR, IDENTIFIER,
  
  // Keywords
  INT, CHAR, VOID,
  IF, ELSE, WHILE, FOR, RETURN,
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
  LPAREN, RPAREN, LBRACE, RBRACE,
  LBRACKET, RBRACKET,
  COMMA, SEMICOLON, COLON,
  
  // Special
  EOF, COMMENT, PREPROCESSOR
}
```

## AST Node Types

| Node Type | Description |
|-----------|-------------|
| `TranslationUnit` | Root node with all declarations |
| `FunctionDeclaration` | Function prototype |
| `FunctionDefinition` | Function with body |
| `VariableDeclaration` | Variable declaration |
| `Parameter` | Function parameter |
| `IfStatement` | If/else statement |
| `WhileStatement` | While loop |
| `ForStatement` | For loop |
| `ReturnStatement` | Return statement |
| `Block` | Compound statement |
| `Assignment` | Assignment expression |
| `BinaryExpression` | Binary operation |
| `UnaryExpression` | Unary operation |
| `CallExpression` | Function call |
| `ArrayAccess` | Array element access |
| `MemberAccess` | Struct member access |
| `NumberLiteral` | Numeric literal |
| `StringLiteral` | String literal |
| `Identifier` | Variable reference |

## Example Programs

### Fibonacci

```c
int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    return fibonacci(10);
}
```

### Bubble Sort

```c
void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7;
    bubbleSort(arr, n);
    return arr[0];
}
```

### Linked List

```c
struct Node {
    int data;
    struct Node* next;
};

int sumList(struct Node* head) {
    int sum = 0;
    struct Node* current = head;
    while (current != 0) {
        sum = sum + current->data;
        current = current->next;
    }
    return sum;
}
```

## Extending the Compiler

### Adding a New Operator

1. **Lexer** (`CLexer.tokenize()`):
```typescript
// Add two-char operator detection
const two = char + this.peek(1);
if (two === '==') { /* ... */ }
```

2. **Parser** (`CParser`):
```typescript
// Add parsing rule
private parseEquality(): ASTNode {
    let lhs = this.parseRelational();
    if (this.peek().type === TokenType.EQ) {
        this.advance();
        lhs = { type: 'BinaryExpression', operator: '==', left: lhs, right: this.parseEquality() };
    }
    return lhs;
}
```

3. **Code Generator**:
```typescript
case '==': return `${this.generate(left)} === ${this.generate(right)}`;
```

### Adding a New Statement Type

1. Add AST node type
2. Add parser rule
3. Add code generation

## WebAssembly Output Format

```wasm
;; WebAssembly module structure
(module
  (func $add (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
  
  (func $main (result i32)
    (call $add (i32.const 2) (i32.const 3)))
  
  (export "main" (func $main)))
```

## Error Handling

The compiler provides clear error messages:

```typescript
try {
    compile(source);
} catch (e) {
    console.error(e.message);
    // "Unexpected token: '}' at 5:14"
}
```

## Performance Considerations

1. **Scannerless Parsing** - Simple but can be slow for large files
2. **Single-pass Compilation** - No optimization passes yet
3. **Tree-walking Interpreter** - Simple but not optimal

## Future Enhancements

- [ ] Full type system (float, double, long)
- [ ] Arrays and pointers optimization
- [ ] LLVM IR generation
- [ ] Optimizer passes
- [ ] Better error messages
- [ ] Debug info (DWARF)
- [ ] Standard library

## Contributing

Contributions welcome:

1. Add missing C features
2. Improve error reporting
3. Add optimizations
4. Implement standard library
5. Add more test cases

## Resources

### Books
- [Compilers: Principles, Techniques, and Tools](https://www.amazon.com/Compilers-Principles-Techniques-Tools-2nd/dp/0321486811) - "The Dragon Book"
- [Modern Compiler Implementation in C](https://www.amazon.com/Modern-Compiler-Implementation-C-Book/dp/052132390X)
- [Crafting a Compiler](https://www.amazon.com/Crafting-Compiler-Charles-Fischer/dp/0136067052)

### Online Resources
- [Writing a C Compiler](https://norasandler.com/2017/11/29/Write-a-Compiler.html)
- [C Language Specification](https://web.archive.org/web/20181216035450/http://www.open-std.org/JTC1/SC22/WG14/www/abq/c17_updated_proposal.pdf)
- [WebAssembly Specification](https://webassembly.github.io/spec/)

## License

MIT License
