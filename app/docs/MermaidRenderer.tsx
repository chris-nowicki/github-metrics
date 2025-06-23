'use client'

import { useEffect } from 'react'
import mermaid from 'mermaid'

interface MermaidRendererProps {
	children: React.ReactNode
}

export default function MermaidRenderer({ children }: MermaidRendererProps) {
	useEffect(() => {
		// Initialize Mermaid
		mermaid.initialize({
			startOnLoad: true,
			theme: 'default',
			securityLevel: 'loose',
		})

		// Find and render Mermaid diagrams
		const renderMermaidDiagrams = async () => {
			const mermaidElements = document.querySelectorAll('code.language-mermaid')

			for (let i = 0; i < mermaidElements.length; i++) {
				const element = mermaidElements[i] as HTMLElement
				const parent = element.parentElement

				if (parent && parent.tagName === 'PRE') {
					const mermaidCode = element.textContent || ''
					const id = `mermaid-${i}`

					try {
						const { svg } = await mermaid.render(id, mermaidCode)
						const div = document.createElement('div')
						div.innerHTML = svg
						div.className = 'mermaid-diagram bg-white p-4 rounded border my-4'
						parent.replaceWith(div)
					} catch (error) {
						console.error('Mermaid rendering error:', error)
						// Keep the original code block if rendering fails
					}
				}
			}
		}

		// Small delay to ensure DOM is ready
		setTimeout(renderMermaidDiagrams, 100)
	}, [])

	return <>{children}</>
}
