<!-- @component Shared menu, tutorial, about and reset flow. Props: preferences, installer, initial, optional report, onreset, onclose, closeLabel. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { Installer } from '../../app/install.svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { appReportUrl, type ReportKind } from '../../app/report';
  import { strings } from '../../i18n';
  import AboutDialog from './AboutDialog.svelte';
  import Menu from './Menu.svelte';
  import ReportDialog from './ReportDialog.svelte';
  import ResetDialog from './ResetDialog.svelte';
  import Tutorial from './tutorial/Tutorial.svelte';

  let {
    preferences,
    installer,
    initial = 'menu',
    report,
    onreset,
    onclose,
    closeLabel = strings.backToGame,
  }: {
    preferences: Preferences;
    installer: Installer;
    initial?: 'menu' | 'tutorial';
    report?: (kind: ReportKind) => string;
    onreset: () => void;
    onclose: () => void;
    closeLabel?: string;
  } = $props();
  let panel = $state<'menu' | 'tutorial' | 'about' | 'report' | 'reset'>(untrack(() => initial));
</script>

{#if panel === 'menu'}
  <Menu
    {preferences}
    {installer}
    {closeLabel}
    ontutorial={() => (panel = 'tutorial')}
    onabout={() => (panel = 'about')}
    onreport={report ? () => (panel = 'report') : undefined}
    reportLink={appReportUrl(__VERSION__, __BUILD__)}
    {onclose}
  />
{:else if panel === 'tutorial'}
  <Tutorial
    onclose={() => {
      preferences.tutorialSeen = true;
      onclose();
    }}
  />
{:else if panel === 'about'}
  <AboutDialog onreset={() => (panel = 'reset')} {onclose} />
{:else if panel === 'reset'}
  <ResetDialog
    onconfirm={() => {
      onreset();
      onclose();
    }}
    {onclose}
  />
{:else if report}
  <ReportDialog link={report} {onclose} />
{/if}
