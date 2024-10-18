"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
(_a = document.getElementById("ticketForm")) === null || _a === void 0 ? void 0 : _a.addEventListener("submit", function (event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const vatin = document.getElementById("vatin").value;
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        try {
            const tokenResponse = yield fetch('/get-token', { method: 'GET' });
            if (!tokenResponse.ok) {
                throw new Error('Greška s tokenom.');
            }
            const tokenData = yield tokenResponse.json();
            const accessToken = tokenData.access_token;
            const response = yield fetch("/generate-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ vatin, firstName, lastName })
            });
            if (response.ok) {
                const data = yield response.json();
                document.getElementById("qrCodeImage").src = data.qrCodeImage;
                document.getElementById("qrCodeContainer").style.display = "block";
                const linkElement = document.getElementById("ticketLink");
                linkElement.href = data.qrCodeUrl;
                linkElement.textContent = data.qrCodeUrl;
                linkElement.style.display = "block";
            }
            else {
                const errorMessage = yield response.text();
                alert(errorMessage);
            }
        }
        catch (error) {
            console.error("Došlo je do greške:", error);
        }
    });
});
