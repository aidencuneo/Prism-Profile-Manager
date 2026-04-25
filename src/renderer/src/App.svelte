<script>
    import { onMount } from 'svelte';
    import Modpack from './components/Modpack.svelte';
    import Button from './components/Button.svelte';

    const api = window.api;
    let instances = $state([]);

    async function importModpack() {
        await api.importModpack();
    }

    onMount(async () => {
        instances = await api.getInstances();
    });
</script>

<wrapper>
    <app-title>Prism Profile Manager</app-title>
    {#each instances as name}
        <Modpack {name} />
    {/each}
    <Button onclick={importModpack}>Import Modpack</Button>
</wrapper>

<style>
    app-title {
        display: block;
        text-align: center;
        font-size: 30px;
        padding: 20px 20px 20px 20px;
    }

    p {
        font-size: 30px;
    }
</style>
