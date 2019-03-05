// 监听一个属性的变化 解决
// 解除对某个对象所有属性的监听 解决
// 同时监听多个属性的变化，传入数组 解决
// 监听所有属性的变化，不传 解决
// 监听属性值为对象的变化，深度监听 解决
/**
 * auther shenjiuer
 * email shenjiuer@163.com
 */
var watchjs = {
  arrMethods: ['pop', 'push', 'splice', 'shift', 'unshift', 'sort', 'reverse'],
  arrayPush: {},
  isArray: function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
  },
  defineGetAndSet: function(obj, propName, setter, getter) {
    Object.defineProperty(obj, propName, {
      enumerable: true, // 能被枚举，监听的对象属性应该可以被枚举，即hasOwnProperty访问到
      configurable: true, // 可以被删除或者修改属性的特性(enumerable...)
      set: setter,
      get: getter
    })
  },
  defineProp: function(obj, propName, value) {
    Object.defineProperty(obj, propName, {
      enumerable: false, // 不能被枚举，在Object.property上自定义的属性不应该被枚举
      configurable: true, // 可以被删除或者修改属性的特性(enumerable...)
      writable: false, // 不可被重写，防止被他人重写
      value: value // 设置值，与setter, getter不共存
    })
  }
}
// 订阅
watchjs.defineProp(Object.prototype, 'onWatch', function() {
  if (arguments.length === 1) {
    this.onWatchAll(arguments[0])
  } else {
    if (watchjs.isArray(arguments[0])) {
      this.onWatchMany.apply(this, arguments)
    } else {
      this.onWatchOne.apply(this, arguments)
    }
  }
})
// 监听一个属性
watchjs.defineProp(Object.prototype, 'onWatchOne', function(prop, handler) {
  var obj = this // 被监听的对象
  var val = obj[prop]
  // 深度监听
  if (obj[prop] !== null && (obj[prop] instanceof Object)) {
    obj[prop].onWatchAll(handler)
  }
  if (!obj.handlers) {
    watchjs.defineProp(obj, 'handlers', {})
  }
  if (!obj.handlers.hasOwnProperty(prop)) {
    obj.handlers[prop] = [handler]
  } else {
    obj.handlers[prop].push(handler)
  }
  var getter = function() {
    return val
  }
  var setter = function(newVal) {
    if (val !== newVal) {
      val = newVal
      obj.emitWatch(prop)
    }
  }
  watchjs.defineGetAndSet(obj, prop, setter, getter)
})
// 监听多个属性，对每个属性进行一次监听
watchjs.defineProp(Object.prototype, 'onWatchMany', function(props, handler) {
  for (let i = 0; i < props.length; i++) {
    this.onWatchOne(props[i], handler)
  }
})
// 监听所有属性
watchjs.defineProp(Object.prototype, 'onWatchAll', function(handler) {
  if (!(this instanceof Object)) {
    return
  }
  if (watchjs.isArray(this)) {
    this.onWatchArr(handler)
    return
  }
  var props = []
  for (var prop in this) {
    props.push(prop)
  }
  this.onWatchMany(props, handler)
})
watchjs.defineProp(Object.prototype, 'onWatchArr', function (handler) {
  watchjs.arrMethods.forEach(function (method) {
    var original = Array.prototype[method]
    watchjs.arrayPush[method] = function () {
      handler.apply(this)
      return original.apply(this, arguments)
    }
  })
  this.__proto__ = watchjs.arrayPush
})
// 发布
watchjs.defineProp(Object.prototype, 'emitWatch', function(prop) {
  var obj = this
  if (obj.handlers.hasOwnProperty(prop)) {
    for (let i = 0; i < obj.handlers[prop].length; i++) {
      obj.handlers[prop][i]()
    }
  }
})
// 取消订阅
watchjs.defineProp(Object.prototype, 'unWatch', function(prop) {
  var obj = this
  if (obj.handlers.hasOwnProperty(prop)) {
    delete obj.handlers[prop]
  }
})
