import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App branding - Parallel Eats only in header, Bharat Parallel in footer', () => {
  it('header shows only Parallel Eats, not "from Bharat Parallel"', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('Parallel Eats');
    expect(header).not.toHaveTextContent('from Bharat Parallel');
  });

  it('footer keeps Bharat Parallel credit', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(/Bharat Parallel/);
  });
});
