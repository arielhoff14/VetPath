'use client';
import {useEffect,useRef,type ReactNode} from 'react';
export function TrackedResult({children,onVisible}:{children:ReactNode;onVisible:()=>void}){const ref=useRef<HTMLElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=0.5)){onVisible();observer.disconnect();}},{threshold:0.5});observer.observe(el);return()=>observer.disconnect()},[onVisible]);return <article ref={ref}>{children}</article>;}
