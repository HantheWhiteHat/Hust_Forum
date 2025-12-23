import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })

        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo)
        }

        // TODO: Send to error tracking service (e.g., Sentry)
        // logErrorToService(error, errorInfo)
    }

    handleRefresh = () => {
        window.location.reload()
    }

    handleGoHome = () => {
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#DAE0E6] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-300 max-w-md w-full p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-600 mb-6">
                            We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-gray-100 rounded p-3 mb-6 text-left overflow-auto max-h-32">
                                <p className="text-xs font-mono text-red-600">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-[#FF4500] text-white rounded-full font-bold hover:bg-[#FF5722] transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-full font-bold hover:bg-gray-50 transition"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
