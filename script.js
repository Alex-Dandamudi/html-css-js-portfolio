function toggleMenu(){
    const menu= document.querySelector(".menu-links");
    const icon= document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
<script>
    var typed = new Typed("".auto-type",{
        strings: ["Frontend Developer", "ML Engineer", "Software Developer"],
        typeSpeed: 150;
        backSpeed: 150;
        loop: true)
    }
</script>