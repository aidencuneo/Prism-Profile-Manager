<script>
    let { onclick, children, ...props } = $props();
</script>

<div {onclick} {...props}>
    {@render children?.()}
</div>

<style>
    div {
        display: block;
        background: #323232;
        color: #96DB59;
        padding: 15px;
        margin: 9px;
        border-radius: 9px;
        text-align: center;
        user-select: none;
    }

    div:hover {
        background: #222222;
    }

    div:active {
        background: #161616;
    }
</style>
