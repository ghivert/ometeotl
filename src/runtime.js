import type { AST } from './types'

function defun(ast: Array<AST>) {
  console.log(ast)
}

let modules = {
  kernel: {
    defun: defun
  }
}

const interpret = (namespace: Array<string>) => (ast: AST) => {
  switch (ast.type) {
    case 'List':
      return callFunction(namespace, ast)
  }
  return ''
}

function callFunction(namespace, ast) {
  const functionNamespace = expectId(ast.value[0]).split('.')
  const modulesNamespace = functionNamespace.slice(0, functionNamespace.length - 1)
  const functionName = functionNamespace[functionNamespace.length - 1]
  const fetchedModule = modulesNamespace.length > 0 ? fetchModule(modulesNamespace) : null
  if (fetchedModule) {
    return fetchedModule[functionName](ast.value.slice(1))
  } else {
    const localModule = fetchModule(namespace)
    if (localModule) {
      return localModule[functionName](ast.value.slice(1))
    } else {
      if (modules.kernel[functionName]) {
        return modules.kernel[functionName](ast.value.slice(1))
      }
    }
  }
}

function expectId(ast: AST): string {
  if (ast.type !== 'Identifier') {
    throw 'Expect Identifier'
  } else {
    return ast.value
  }
}

function fetchModule(namespace) {
  return namespace
    .reduce((accumulator, value) => {
      if (accumulator) {
        return accumulator[value]
      } else {
        return null
      }
    }, modules)
}

module.exports = {
  modules: modules,
  interpret: interpret
}
