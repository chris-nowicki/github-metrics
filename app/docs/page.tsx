import fs from 'fs'
import path from 'path'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'
import MermaidRenderer from './MermaidRenderer'
import './docs.css'

interface TocItem {
	id: string
	title: string
	level: number
}

async function getMarkdownContent() {
	const markdownPath = path.join(process.cwd(), 'app/docs/docs.md')
	const fileContents = fs.readFileSync(markdownPath, 'utf8')

	const processedContent = await remark()
		.use(remarkGfm)
		.use(html)
		.process(fileContents)

	return processedContent.toString()
}

function extractTableOfContents(markdownContent: string): TocItem[] {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm
	const toc: TocItem[] = []
	let match

	while ((match = headingRegex.exec(markdownContent)) !== null) {
		const level = match[1].length
		const title = match[2].trim()
		const id = title
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.trim()

		toc.push({ id, title, level })
	}

	return toc
}

function addIdsToHeadings(htmlContent: string): string {
	return htmlContent.replace(
		/<h([1-6])>(.*?)<\/h[1-6]>/g,
		(match, level, title) => {
			const id = title
				.replace(/<[^>]*>/g, '')
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-')
				.trim()
			return `<h${level} id="${id}" class="docs-heading-${level}">${title}</h${level}>`
		}
	)
}

export default async function DocsPage() {
	const markdownPath = path.join(process.cwd(), 'app/docs/docs.md')
	const markdownContent = fs.readFileSync(markdownPath, 'utf8')

	const content = await getMarkdownContent()
	const contentWithIds = addIdsToHeadings(content)
	const toc = extractTableOfContents(markdownContent)

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-white border-b border-gray-200 sticky top-0 z-10'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						<h1 className='text-xl font-semibold text-gray-900'>
							Vercel Cron Jobs Documentation
						</h1>
						<a
							href='/'
							className='text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors'
						>
							← Back to Demo
						</a>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='flex gap-8'>
					{/* Table of Contents - Left Sidebar */}
					<aside className='w-64 flex-shrink-0'>
						<div className='sticky top-24'>
							<div className='bg-white rounded-lg border border-gray-200 p-4 shadow-sm'>
								<h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>
									Table of Contents
								</h2>
								<nav className='space-y-1'>
									{toc.map((item, index) => (
										<a
											key={index}
											href={`#${item.id}`}
											className={`
												block py-1.5 text-sm transition-colors duration-150 hover:text-blue-600 rounded px-2 hover:bg-blue-50
												${item.level === 1 ? 'font-medium text-gray-900' : ''}
												${item.level === 2 ? 'text-gray-700 ml-3' : ''}
												${item.level === 3 ? 'text-gray-600 ml-6' : ''}
												${item.level >= 4 ? 'text-gray-500 ml-9' : ''}
											`}
										>
											{item.title}
										</a>
									))}
								</nav>
							</div>
						</div>
					</aside>

					{/* Main Content */}
					<main className='flex-1 min-w-0'>
						<div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
							<div className='p-8'>
								<MermaidRenderer>
									<div
										className='docs-content'
										dangerouslySetInnerHTML={{ __html: contentWithIds }}
									/>
								</MermaidRenderer>
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	)
}
