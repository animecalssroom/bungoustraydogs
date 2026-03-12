"use client";
import React from 'react'

export class ErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // Optionally log error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}>
          <span
            className="font-cormorant"
            style={{
              fontStyle: 'italic',
              fontSize: '1.3rem',
              color: 'var(--text2)',
              textAlign: 'center',
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            The registry is temporarily unavailable.<br />The city is aware.
          </span>
        </div>
      )
    }
    return this.props.children
  }
}