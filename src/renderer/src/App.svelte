<script>
    import { onMount } from 'svelte'
    import Modpack from './components/Modpack.svelte'
    import Button from './components/Button.svelte'

    const api = window.api

    let instancePath = ''
    let instances = $state([])

    let latestVersion = $state('')
    let latestVersionURL = $state('')
    let needsUpdate = $state(false)

    async function importModpack() {
        await api.importModpack()
    }

    onMount(async () => {
        instancePath = await api.getInstancePath()
        instances = await api.getInstances()
        ;({ latestVersion, latestVersionURL, needsUpdate } = await api.getLatestVersion())
        console.log(latestVersion, latestVersionURL, needsUpdate);
    })

    api.onInstancesUpdated(async () => {
        instances = await api.getInstances()
    })
</script>

<wrapper>
    <app-header>
        <app-title>Prism Profile Manager</app-title>
        <Button onclick={async () => await api.openPath(instancePath)} style="padding-block: 12px; margin-block: 0">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#96DB59"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>
        </Button>
    </app-header>

    {#if needsUpdate}
        <Button onclick={() => api.openPath(latestVersionURL)}>
            Version {latestVersion} Available!
        </Button>
    {/if}

    {#each instances as name}
        <Modpack {name} />
    {/each}

    <Button onclick={importModpack}>Import Modpack</Button>
</wrapper>

<style>
    app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 9px;
        padding-left: 24px;
        padding-right: 0px;
    }

    app-title {
        text-align: center;
        font-size: 32px;
    }
</style>
