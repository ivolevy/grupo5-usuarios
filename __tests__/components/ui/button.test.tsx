import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('should handle click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
  })

  it('should apply size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    
    const button = screen.getByRole('button', { name: /small button/i })
    expect(button).toHaveClass('h-8')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    
    const button = screen.getByRole('button', { name: /custom button/i })
    expect(button).toHaveClass('custom-class')
  })

  it('should have data-slot attribute', () => {
    render(<Button>Test Button</Button>)
    
    const button = screen.getByRole('button', { name: /test button/i })
    expect(button).toHaveAttribute('data-slot', 'button')
  })

  describe('buttonVariants', () => {
    it('should return correct classes for default variant', () => {
      const classes = buttonVariants()
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('text-primary-foreground')
    })

    it('should return correct classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-destructive')
    })

    it('should return correct classes for outline variant', () => {
      const classes = buttonVariants({ variant: 'outline' })
      expect(classes).toContain('border')
      expect(classes).toContain('bg-background')
    })

    it('should return correct classes for secondary variant', () => {
      const classes = buttonVariants({ variant: 'secondary' })
      expect(classes).toContain('bg-secondary')
    })

    it('should return correct classes for ghost variant', () => {
      const classes = buttonVariants({ variant: 'ghost' })
      expect(classes).toContain('hover:bg-accent')
    })

    it('should return correct classes for link variant', () => {
      const classes = buttonVariants({ variant: 'link' })
      expect(classes).toContain('text-primary')
      expect(classes).toContain('underline-offset-4')
    })

    it('should return correct classes for different sizes', () => {
      expect(buttonVariants({ size: 'sm' })).toContain('h-8')
      expect(buttonVariants({ size: 'lg' })).toContain('h-10')
      expect(buttonVariants({ size: 'icon' })).toContain('size-9')
    })
  })
})
