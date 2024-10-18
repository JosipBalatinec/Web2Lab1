document.getElementById("ticketForm")?.addEventListener("submit", async function(event) {

    event.preventDefault();
    const vatin: string = (document.getElementById("vatin") as HTMLInputElement).value;
    const firstName: string = (document.getElementById("firstName") as HTMLInputElement).value;
    const lastName: string = (document.getElementById("lastName") as HTMLInputElement).value;
    
    try {
        const tokenResponse = await fetch('/get-token', {method: 'GET'});

        if(!tokenResponse.ok) {
            throw new Error('Greška s tokenom.');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        const response = await fetch("/generate-ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ vatin, firstName, lastName })
        });

        if (response.ok) {
            const data = await response.json();
            (document.getElementById("qrCodeImage") as HTMLImageElement).src = data.qrCodeImage;
            (document.getElementById("qrCodeContainer") as HTMLDivElement).style.display = "block";

            const linkElement = document.getElementById("ticketLink") as HTMLAnchorElement;
            linkElement.href = data.qrCodeUrl;
            linkElement.textContent = data.qrCodeUrl;
            linkElement.style.display = "block";
        } else {
            const errorMessage = await response.text();
            alert(errorMessage);
        }
    } catch (error) {
        console.error("Došlo je do greške:", error);
    }
});