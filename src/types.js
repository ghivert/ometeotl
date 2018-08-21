export type AST
  = Atom
  | { type: 'List', value: Array<AST> }
  | { type: 'Array', value: Array<AST> }

export type Atom
  = {
    type: 'Identifier' | 'String' | 'Symbol',
    value: string
  }
  | {
    type: 'Float' | 'Int',
    value: number
  }

export type Environment = {
  variables: {
    modules: ?{}
  },
  ancestor: ?Environment
}
