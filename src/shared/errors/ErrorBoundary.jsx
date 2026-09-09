import { Component } from 'react'
import { handleError, getUserMessage } from '@/shared/errors/errorHandler'

/**
 * Catches render/runtime errors in the React tree.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: getUserMessage(error) }
  }

  componentDidCatch(error, info) {
    handleError(error, { context: 'ErrorBoundary', silent: true })
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary stack:', info?.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#eef5f8] px-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Something broke</p>
          <p className="max-w-md text-sm text-slate-500">{this.state.message}</p>
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            onClick={() => {
              this.setState({ hasError: false, message: '' })
              window.location.assign('/app')
            }}
          >
            Go to Command Center
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
