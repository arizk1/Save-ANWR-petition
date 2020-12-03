(function () {
    const canvas = $("#canvas");
    const ctx = canvas[0].getContext("2d");

    canvas.on("mousedown", (e) => {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        canvas.on("mousemove", (evt) => {
            let mousePoX = evt.pageX;
            let mousePoY = evt.pageY;
            console.log("X", mousePoX);
            console.log("Y", mousePoY);

            ctx.moveTo(mousePoX, mousePoY);
            ctx.lineTo(mousePoX, mousePoY);
        });
    });

    canvas.on("mousedown", (e) => {
        canvas.on("mousemove", (evt) => {
            let mousePoX = evt.clientX;
            let mousePoY = evt.clientY;
            let canvasOffSet = canvas.offset();

            console.log("X", mousePoX);
            console.log("Y", mousePoY);

            ctx.beginPath();
            ctx.strokeStyle = "royalblue";
            ctx.lineWidth = 4;
            ctx.moveTo(
                e.clientX - canvasOffSet.left,
                e.clientY - canvasOffSet.top
            );
            // ctx.lineTo(
            //     mousePoX - canvasOffSet.left,
            //     mousePoY - canvasOffSet.top
            // );
            // ctx.moveTo(
            //     mousePoX - canvasOffSet.left,
            //     mousePoY - canvasOffSet.top
            // );
            // ctx.lineTo(
            //     mousePoX - canvasOffSet.left,
            //     mousePoY - canvasOffSet.top
            // );
            // ctx.moveTo(
            //     mousePoX - canvasOffSet.left,
            //     mousePoY - canvasOffSet.top
            // );

            ctx.stroke();
        });
    });

    canvas.on("mouseup", (e) => {
        ctx.closePath();
        console.log("upppp");
        canvas.off("mousemove");
    });
})();
