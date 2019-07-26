import * as React from 'react'

// Often you only want a submit-type prop to fire once, unless a specific prop changes (aka you want it to work again when this.props.error changes or something)
// This HOC lets you wrap a container and tell it which keys you want to have this behavior aka
// export default compose(
// connect(mapStateToProps, mapDispatchToProps, mergeProps),
// safeSubmit(['onSubmit', 'onBack'], ['error'])
// )(MyComponent)

export function safeSubmit(submitProps: Array<string>, resetSafeProps: Array<string>) {
  return function<P extends {}>(BaseComponent: React.ComponentType<P>): React.ComponentType<P> {
    class SafeSubmit extends React.Component<P> {
      // a map of name to boolean if we can call it safely
      _safeToCallWrappedMap = submitProps.reduce<{[key: string]: boolean}>((map, name) => {
        map[name] = true
        return map
      }, {})

      componentDidUpdate(prevProps: P) {
        if (resetSafeProps.some(k => this.props[k] !== prevProps[k])) {
          // reset safe settings
          Object.keys(this._safeToCallWrappedMap).forEach(n => (this._safeToCallWrappedMap[n] = true))
        }
      }

      render() {
        const wrapped = submitProps.reduce((map, name) => {
          const old = this.props[name]
          if (old) {
            map[name] = (...args: Array<any>) => {
              if (this._safeToCallWrappedMap[name]) {
                this._safeToCallWrappedMap[name] = false
                old(...args)
              }
            }
          }
          return map
        }, {})

        return <BaseComponent {...this.props} {...wrapped} />
      }
    }
    return SafeSubmit
  }
}

// Similar to above but it never gets reset, useful for screens that want the safety while mounted
export const safeSubmitPerMount = (submitProps: Array<string>) => safeSubmit(submitProps, [])
