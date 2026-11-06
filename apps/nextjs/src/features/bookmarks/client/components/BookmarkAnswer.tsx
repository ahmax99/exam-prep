import { ChevronDown } from 'lucide-react'

import type { BookmarkListItem } from '@/features/bookmarks/server/api'
import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'
import { cn } from '@/utils/mergeClass'

interface BookmarkAnswerProps {
  item: Pick<
    BookmarkListItem,
    'type' | 'options' | 'correctLetters' | 'answerDisplay' | 'explanation'
  >
}

// Native <details> keeps the answer hidden until asked for, with no client state.
function BookmarkAnswer({ item }: Readonly<BookmarkAnswerProps>) {
  const correct = new Set(item.correctLetters)
  const isChoice = item.type !== 'FILL_IN' && item.options.length > 0

  return (
    <details className="group/answer mt-3" data-slot="bookmark-answer">
      <summary className="text-muted-foreground hover:text-foreground inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 -rotate-90 transition-transform group-open/answer:rotate-0"
        />
        <span className="group-open/answer:hidden">Show answer</span>
        <span className="hidden group-open/answer:inline">Hide answer</span>
      </summary>

      <div className="mt-1.5 flex flex-col gap-3">
        {isChoice ? (
          <ul aria-label="Answer options" className="flex flex-col gap-2">
            {item.options.map(({ letter, text }) => {
              const isCorrect = correct.has(letter)
              return (
                <li
                  key={letter}
                  className={cn(
                    'flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-sm leading-[1.55]',
                    isCorrect
                      ? 'border-success bg-success/10'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-[22px] shrink-0 items-center justify-center rounded-[3px] border font-mono text-[10px]',
                      isCorrect
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-border'
                    )}
                  >
                    {letter}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    <PromptMarkdown text={text} />
                  </span>
                  {isCorrect && (
                    <span className="text-success ml-auto shrink-0 text-xs font-medium">
                      Correct
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="flex items-baseline gap-2.5 text-sm">
            <span className="text-muted-foreground shrink-0">
              Correct answer
            </span>
            <span className="bg-success-tint text-success-ink min-w-0 rounded-[3px] px-1.5 py-0.5 font-mono text-xs tracking-[-0.04em] break-words">
              <PromptMarkdown
                text={item.answerDisplay ?? item.correctLetters.join(', ')}
              />
            </span>
          </p>
        )}
        <div className="bg-muted text-prose-foreground [&_code]:bg-secondary max-w-[70ch] rounded-md px-4 py-3.5 text-sm leading-[1.65]">
          <PromptMarkdown text={item.explanation} />
        </div>
      </div>
    </details>
  )
}

export { BookmarkAnswer }
