import type { ReactNode } from 'react';
import './style.css';
export const metadata = { title: 'VetPath | Find care', description: 'Demonstration of veterinary care discovery.' };
export default function Layout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
