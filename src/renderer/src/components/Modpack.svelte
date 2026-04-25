<script>
    let { name } = $props();

    const api = window.api;
</script>

<modpack-wrapper>
    <modpack-title>{name}</modpack-title>
    <modpack-btn onclick={() => api.exportModpack(name)}>Export</modpack-btn>
</modpack-wrapper>

<style>
    modpack-wrapper {
        display: flex;
        justify-content: space-between;
        background: #323232;
        color: white;
        margin: 9px;
        border-radius: 9px;
        user-select: none;
    }

    modpack-wrapper > * {
        padding: 15px;
    }

    modpack-btn {
        color: #96DB59;
    }

    modpack-btn:hover {
        color: #78b146;
    }

    modpack-btn:active {
        color: #63913a;
    }
</style>
