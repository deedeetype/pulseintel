/**
 * Reusable Action Menu for Archive/Delete operations
 */

'use client'

import { useState } from 'react'
import { Archive, Trash2, MoreVertical } from 'lucide-react'

interface ActionMenuProps {
  itemId: string
  onArchive?: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
  deleteConfirmTitle?: string
  deleteConfirmMessage?: string
  isArchived?: boolean
  deleteButtonLabel?: string
  hideArchive?: boolean
}

export default function ActionMenu({
  itemId,
  onArchive,
  onDelete,
  loading = false,
  deleteConfirmTitle = 'Delete Item?',
  deleteConfirmMessage = 'This action cannot be undone. The item will be permanently removed.',
  isArchived = false,
  deleteButtonLabel = 'Delete',
  hideArchive = false
}: ActionMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleArchive = async () => {
    setActionLoading(true)
    try {
      await onArchive(itemId)
      setShowMenu(false)
    } catch (error) {
      alert('Failed to archive item')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await onDelete(itemId)
      setConfirmDelete(false)
    } catch (error) {
      alert('Failed to delete item')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-2 hover:bg-slate-700 rounded-lg transition"
          disabled={loading || actionLoading}
        >
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20">
              {!hideArchive && onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchive()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                  disabled={actionLoading}
                >
                  <Archive className="w-4 h-4" />
                  {isArchived ? 'Unarchive' : 'Archive'}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(true)
                  setShowMenu(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 ${hideArchive ? 'rounded-lg' : 'rounded-b-lg'}`}
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4" />
                {deleteButtonLabel}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">{deleteConfirmTitle}</h3>
            <p className="text-slate-400 mb-6">{deleteConfirmMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
