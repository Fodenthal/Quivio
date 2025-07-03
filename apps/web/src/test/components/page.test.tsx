import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '../../app/page'

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)
    expect(screen.getByText('PopReplay - Fresh Start ✨')).toBeInTheDocument()
  })

  it('should display setup complete message', () => {
    render(<Home />)
    expect(screen.getByText('🎉 Setup Complete!')).toBeInTheDocument()
  })

  it('should show shared package integration test', () => {
    render(<Home />)
    expect(screen.getByText('📡 Shared Package Integration Test')).toBeInTheDocument()
  })

  it('should display all message types', () => {
    render(<Home />)
    expect(screen.getByText('chat')).toBeInTheDocument()
    expect(screen.getByText('player_ready')).toBeInTheDocument()
    expect(screen.getByText('submit_guess')).toBeInTheDocument()
  })
}) 