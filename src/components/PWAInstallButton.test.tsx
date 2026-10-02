import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PWAInstallButton } from './PWAInstallButton';

describe('PWAInstallButton - download zip removed', () => {
  it('does not render any download zip link', () => {
    const { container } = render(<PWAInstallButton />);
    expect(container.querySelector('a[href="/api/download-source-zip"]')).toBeNull();
    expect(screen.queryByText(/Download .ZIP/i)).toBeNull();
    expect(screen.queryByText(/ratricall-voice-pos\.zip/i)).toBeNull();
  });
});
