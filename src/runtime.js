import type { AST, Environment } from './types'

function defun(namespace, funName, args, body): any {
  let moduleDef = global.__OmeteotlModules
  namespace.split('.').forEach(moduleName => {
    if (!global.__OmeteotlModules[moduleName]) {
      global.__OmeteotlModules[moduleName] = {}
      moduleDef = global.__OmeteotlModules[moduleName]
    } else {
      moduleDef = global.__OmeteotlModules[moduleName]
    }
  })
  if (args.length > 0) {
    moduleDef[funName] = new Function(body)
  } else {
    moduleDef[funName] = new Function(...args, body)
  }
}

function log(arg) {
  console.log(arg)
}

global.__OmeteotlModules = {
  kernel: {
    defun: defun,
    log: log
  }
}

let environment: Environment = {
  variables: {
    modules: global.__OmeteotlModules
  },
  ancestor: null
}

function newEnvironment(environment: Environment): Environment { // eslint-disable-line
  return {
    variables: {
      modules: null
    },
    ancestor: environment
  }
}

function debug<Type>(value: Type): Type { // eslint-disable-line
  console.log(JSON.stringify(value, null, 1))
  return value
}

const compile = (namespace: Array<string>) => (ast: AST) => {
  switch (ast.type) {
    case 'List': {
      const funCall = callFunction(namespace, expectId(ast.value[0]))
      if (funCall[0] === "global.__OmeteotlModules['kernel']['defun']") {
        const newTree = [ { type: 'Identifier', value: namespace.join('.') } ].concat(ast.value.slice(1))
        const content = newTree.map(compile(namespace))
        const modified = content.slice(0, content.length - 1).concat([ `"${content[content.length - 1]}"` ])
        return `${funCall[0]}(${modified.join(', ')});`
      } else {
        return `${funCall[0]}(${ast.value.slice(1).map(compile(namespace)).join(', ')});`
      }
    }
    case 'Identifier': {
      return `'${ast.value}'`
    }
    case 'String': return `'${ast.value}'`
    case 'Array': {
      return `[${ast.value.map(compile(namespace)).join(', ')}]`
    }
  }
  return ''
}

function callFunction(namespace, qualifiedName): [string, number] {
  const functionNamespace = qualifiedName.split('.')
  const modulesNamespace = functionNamespace.slice(0, functionNamespace.length - 1)
  const functionName = functionNamespace[functionNamespace.length - 1]
  const fetchedModule = modulesNamespace.length > 0 ? fetchModule(modulesNamespace, functionName) : null
  if (modulesNamespace.length > 0) {
    if (fetchedModule) {
      const arity = fetchArity(global.__OmeteotlModules, fetchedModule, functionName)
      return [ `global.__OmeteotlModules${fetchedModule.map(moduleName => `['${moduleName}']`).join('')}['${functionName}']`, arity ]
    } else {
      throw 'Module ' + modulesNamespace.join('.') + ' don\'t exist'
    }
  } else {
    const localModule = fetchModule(namespace, functionName)
    if (localModule) {
      const arity = fetchArity(global.__OmeteotlModules, localModule, functionName)
      return [ `global.__OmeteotlModules${localModule.map(moduleName => `['${moduleName}']`).join('')}['${functionName}']`, arity ]
    } else {
      if (global.__OmeteotlModules.kernel[functionName]) {
        const arity = global.__OmeteotlModules.kernel[functionName].length
        return [ `global.__OmeteotlModules['kernel']['${functionName}']`, arity ]
      } else {
        throw 'Function does not exists'
      }
    }
  }
}

function fetchArity(modules, fetchedModule, functionName) {
  const module: any = fetchedModule.reduce((accumulator: any, value) => {
    return accumulator[value]
  }, global.__OmeteotlModules)
  return module[functionName].length
}

function expectId(ast: AST): string {
  if (ast.type !== 'Identifier') {
    throw 'Expect Identifier'
  } else {
    return ast.value
  }
}

function expectArray(ast: AST): Array<AST> { // eslint-disable-line
  if (ast.type !== 'Array') {
    throw 'Expect Array'
  } else {
    return ast.value
  }
}

function fetchModule(namespace, functionName) {
  const moduleName = namespace
    .reduce((accumulator, value) => {
      if (accumulator) {
        const module = accumulator[1][value]
        if (module) {
          return [ accumulator[0].concat([value]), module ]
        } else {
          return null
        }
      } else {
        return null
      }
    }, [ [], global.__OmeteotlModules ])
  if (moduleName && moduleName[1][functionName]) {
    return moduleName[0]
  } else {
    return null
  }
}

module.exports = {
  environment: environment,
  compile: compile
}
