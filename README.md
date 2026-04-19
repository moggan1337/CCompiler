# CCompiler 🔧

**C Compiler targeting WebAssembly**

## Features

- **📝 C Lexer** - Full C tokenization
- **🎯 C Parser** - Recursive descent parser
- **🌳 AST** - Complete C AST nodes
- **⚙️ Semantic Analysis** - Type checking (planned)
- **💾 LLVM IR** - Generation (planned)
- **🐍 WASM** - WebAssembly output

## Supported C Syntax

```c
// Functions
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Variables
int x = 10;
char* str = "Hello";

// Control flow
if (x > 0) {
    x = x - 1;
} else {
    x = 0;
}

while (x > 0) {
    x--;
}

for (int i = 0; i < 10; i++) {
    printf("%d\n", i);
}

// Pointers & arrays
int arr[10];
int* ptr = &arr[0];
```

## Installation

```bash
npm install ccompiler
```

## Usage

```typescript
import { compile, toWasm } from 'ccompiler';

const source = `
int add(int a, int b) {
    return a + b;
}

int main() {
    return add(2, 3);
}
`;

const ast = compile(source);
console.log(ast);

const wasm = toWasm(source);
console.log('WASM bytes:', wasm);
```

## Architecture

```
C Source Code
    ↓
  CLexer
    ↓
  Tokens
    ↓
  CParser
    ↓
   AST
    ↓
Semantic Analysis
    ↓
  Typed AST
    ↓
LLVM IR Gen
    ↓
  LLVM IR
    ↓
  WASM Output
```

## Target Output

- WebAssembly (WASM)
- JavaScript (via Emscripten-style output)

## License

MIT
