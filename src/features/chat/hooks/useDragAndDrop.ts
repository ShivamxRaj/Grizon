import { useState, type DragEvent } from 'react'

interface DragProps {
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}

/** File drag-and-drop onto a container. Reports `active` for the highlight
 * ring and routes dropped files through the same handler as the picker. */
export function useDragAndDrop(onFiles: (files: FileList) => void): { active: boolean; dragProps: DragProps } {
  const [active, setActive] = useState(false)

  const dragProps: DragProps = {
    onDragOver: (event) => {
      event.preventDefault()
      setActive(true)
    },
    onDragLeave: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setActive(false)
    },
    onDrop: (event) => {
      event.preventDefault()
      setActive(false)
      if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files)
    },
  }

  return { active, dragProps }
}
