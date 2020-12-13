(function () {
    const canvas = $("#canvas");
    const ctx = canvas[0].getContext("2d");
    let canvasOffSet = canvas.offset();

    canvas.on("mousedown", (e) => {
        ctx.beginPath();
        ctx.moveTo(e.clientX - canvasOffSet.left, e.clientY - canvasOffSet.top);
        canvas.on("mousemove", (evt) => {
            let mousePoX = evt.clientX;
            let mousePoY = evt.clientY;
            ctx.strokeStyle = "teal";
            ctx.lineWidth = 3;
            ctx.lineTo(
                mousePoX - canvasOffSet.left,
                mousePoY - canvasOffSet.top
            );
            ctx.stroke();
        });
    });

    canvas.on("mouseup", () => {
        ctx.closePath();
        canvas.off("mousemove");
        const sign = $(".signature");
        let dataURL = canvas[0].toDataURL();
        sign.val(dataURL);
        // console.log(sign.val());
    });
})();
