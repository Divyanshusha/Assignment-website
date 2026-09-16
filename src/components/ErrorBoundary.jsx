import { Component } from 'react'

/**
 * Generic error boundary. Catches render/runtime errors in its subtree — used
 * to keep a failed Three.js/WebGL canvas from blanking the hero. Renders the
 * `fallback` prop instead of the crashed tree.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Non-fatal: the fallback covers it, but log for diagnostics.
    if (import.meta.env.DEV) {
      console.warn('ErrorBoundary caught an error:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
