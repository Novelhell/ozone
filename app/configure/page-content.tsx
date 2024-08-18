import { useEffect } from 'react'
import { useTitle } from 'react-use'
import client from '@/lib/client'
import { useSession } from '@/lib/useSession'
import { Tabs, TabView } from '@/common/Tabs'
import { LabelerConfig } from 'components/config/Labeler'
import { MemberConfig } from 'components/config/Member'
import { ModActionPanelQuick } from 'app/actions/ModActionPanel/QuickAction'
import { ToolsOzoneModerationEmitEvent } from '@atproto/api'
import { emitEvent } from '@/mod-event/helpers/emitEvent'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { WorkspacePanel } from '@/workspace/Panel'
import { useWorkspaceOpener } from '@/common/useWorkspaceOpener'
import { SetsConfig } from '@/config/Sets'

enum Views {
  Configure,
  Members,
  Sets,
}

const TabKeys = {
  configure: Views.Configure,
  members: Views.Members,
  sets: Views.Sets,
}

export default function ConfigurePageContent() {
  useTitle('Configure')
  const session = useSession()
  useEffect(() => {
    client.reconfigure() // Ensure config is up to date
  }, [])
  const isServiceAccount = !!session && session?.did === session?.config.did
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentView =
    TabKeys[searchParams.get('tab') || 'details'] || TabKeys.configure
  const setCurrentView = (view: Views) => {
    const newParams = new URLSearchParams(searchParams)
    const newTab = Object.entries(TabKeys).find(([, v]) => v === view)?.[0]
    newParams.set('tab', newTab || 'details')
    router.push((pathname ?? '') + '?' + newParams.toString())
  }

  const { toggleWorkspacePanel, isWorkspaceOpen } = useWorkspaceOpener()
  const quickOpenParam = searchParams.get('quickOpen') ?? ''
  const setQuickActionPanelSubject = (subject: string) => {
    const newParams = new URLSearchParams(document.location.search)
    if (!subject) {
      newParams.delete('quickOpen')
    } else {
      newParams.set('quickOpen', subject)
    }
    router.push((pathname ?? '') + '?' + newParams.toString())
  }

  if (!session) return null
  const views: TabView<Views>[] = [
    {
      view: Views.Configure,
      label: 'Configure',
    },
    {
      view: Views.Members,
      label: 'Members',
    },
    {
      view: Views.Sets,
      label: 'Sets',
    },
  ]

  return (
    <div className="w-5/6 sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto my-4 dark:text-gray-100">
      <Tabs
        currentView={currentView}
        onSetCurrentView={setCurrentView}
        views={views}
        fullWidth
      />
      {currentView === Views.Configure && (
        <LabelerConfig session={session} isServiceAccount={isServiceAccount} />
      )}
      {currentView === Views.Members && <MemberConfig />}
      {currentView === Views.Sets && <SetsConfig />}

      <ModActionPanelQuick
        open={!!quickOpenParam}
        onClose={() => setQuickActionPanelSubject('')}
        setSubject={setQuickActionPanelSubject}
        subject={quickOpenParam} // select first subject if there are multiple
        subjectOptions={[quickOpenParam]}
        isInitialLoading={false}
        onSubmit={async (vals: ToolsOzoneModerationEmitEvent.InputSchema) => {
          await emitEvent(vals)
        }}
      />
      <WorkspacePanel
        open={isWorkspaceOpen}
        onClose={() => toggleWorkspacePanel()}
      />
    </div>
  )
}
