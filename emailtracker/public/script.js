document.getElementById("emailForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const to = document.getElementById("to").value;
    const subject = document.getElementById("subject").value;
    const body = document.getElementById("body").value;

    const response = await fetch("http://localhost:3000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
    });

    const result = await response.json();
    alert(result.message);
    loadEmails();
});

// Load Sent Emails
async function loadEmails() {
    const response = await fetch("http://localhost:3000/emails");
    const emails = await response.json();
    const emailList = document.getElementById("emailList");
    emailList.innerHTML = "";

    emails.forEach(email => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${email.email}</td>
            <td>${email.subject}</td>
            <td>${email.status}</td>
            <td><button onclick="deleteEmail('${email._id}')">Delete</button></td>
        `;
        emailList.appendChild(row);
    });
}

// Delete Email
async function deleteEmail(id) {
    const response = await fetch(`http://localhost:3000/delete-email/${id}`, {
        method: "DELETE",
    });
    const result = await response.json();
    alert(result.message);
    loadEmails();
}

loadEmails();
