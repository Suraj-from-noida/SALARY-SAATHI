 let attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    let leaveData = JSON.parse(localStorage.getItem("leaveData")) || [];
    let otData = JSON.parse(localStorage.getItem("otData")) || [];

    window.onload = function() {
        if (localStorage.getItem("isLoggedIn") === "true") {
            document.getElementById("loginScreen").style.display = "none";
        }
        loadAttendance(); loadLeaves(); loadOT(); loadProfile(); updateDashboard();
    };

    function googleLogin() { 
        localStorage.setItem("isLoggedIn", "true");
        document.getElementById("loginScreen").style.transform = "translateY(-100%)";
        setTimeout(() => document.getElementById("loginScreen").style.display = "none", 700);
    }

    function logout() {
        if(confirm("Logout?")) { localStorage.removeItem("isLoggedIn"); window.location.reload(); }
    }

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    function updateDashboard() {
        let presentDays = attendanceData.filter(a => a.status === 'Present').length;
        document.getElementById("presentCount").innerText = presentDays;
        document.getElementById("absentCount").innerText = attendanceData.filter(a => a.status === 'Absent').length;

        let profile = JSON.parse(localStorage.getItem("profileData")) || {};
        let baseSalary = parseFloat(profile.baseSalary || 0);
        let perDayIncome = baseSalary > 0 ? (baseSalary / 30) * presentDays : 0;

        let totalOTAmount = otData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        document.getElementById("otCard").innerText = "₹" + totalOTAmount.toFixed(0);

        let totalBalance = perDayIncome + totalOTAmount;
        document.getElementById("balanceCard").innerText = "₹" + totalBalance.toFixed(0);
        document.getElementById("leaveCard").innerText = leaveData.length;
    }

    /* --- LOGIC FUNCTIONS --- */
    function calculateOnlyOT() {
        let h = document.getElementById("otHoursInput").value;
        let r = document.getElementById("otRateInput").value;
        if(h && r) document.getElementById("otPreviewText").innerText = "Preview: ₹" + (h * r).toFixed(0);
    }

    function saveOTRecord() {
        let date = document.getElementById("otDate").value;
        let h = document.getElementById("otHoursInput").value;
        let r = document.getElementById("otRateInput").value;
        if(!date || !h || !r) return alert("Fill all fields");
        otData.push({ date, hours: h, rate: r, amount: (h*r) });
        localStorage.setItem("otData", JSON.stringify(otData));
        loadOT(); updateDashboard();
    }

    function loadOT() {
        let t = document.getElementById("otTable"); t.innerHTML = "";
        otData.forEach((item, index) => {
            t.innerHTML += `<tr><td>${item.date}</td><td>${item.hours}h</td><td>₹${item.rate}</td><td>₹${item.amount}</td><td><button onclick="deleteOT(${index})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td></tr>`;
        });
    }

    function deleteOT(i) { otData.splice(i, 1); localStorage.setItem("otData", JSON.stringify(otData)); loadOT(); updateDashboard(); }

    function markAttendance(status) {
        let today = new Date().toLocaleDateString();
        if(attendanceData.find(i => i.date === today)) return alert("Already marked!");
        attendanceData.push({date: today, status});
        localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
        loadAttendance(); updateDashboard();
    }

    function loadAttendance() {
        let t = document.getElementById("attendanceTable"); t.innerHTML = "";
        attendanceData.forEach((item, index) => {
            t.innerHTML += `<tr><td>${item.date}</td><td><span class="${item.status == 'Present' ? 'present' : 'absent'}">${item.status}</span></td><td><button onclick="deleteAttendance(${index})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td></tr>`;
        });
    }

    function deleteAttendance(i) { attendanceData.splice(i, 1); localStorage.setItem("attendanceData", JSON.stringify(attendanceData)); loadAttendance(); updateDashboard(); }

    function addLeave() {
        let d = document.getElementById("leaveDate").value;
        let t = document.getElementById("leaveType").value;
        let r = document.getElementById("leaveReason").value;
        if(!d) return alert("Date missing");
        leaveData.push({date: d, type: t, reason: r});
        localStorage.setItem("leaveData", JSON.stringify(leaveData));
        loadLeaves(); updateDashboard();
    }

    function loadLeaves() {
        let t = document.getElementById("leaveTable"); t.innerHTML = "";
        leaveData.forEach((item, index) => {
            t.innerHTML += `<tr><td>${item.date}</td><td>${item.type}</td><td>${item.reason}</td><td><button onclick="deleteLeave(${index})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td></tr>`;
        });
    }

    function deleteLeave(i) { leaveData.splice(i, 1); localStorage.setItem("leaveData", JSON.stringify(leaveData)); loadLeaves(); updateDashboard(); }

    function saveProfile() {
        let p = {
            name: document.getElementById("profileName").value,
            baseSalary: document.getElementById("profileBaseSalary").value,
            employee: document.getElementById("profileEmployee").value,
            company: document.getElementById("profileCompany").value,
            mobile: document.getElementById("profileMobile").value,
            image: document.getElementById("preview").src
        };
        localStorage.setItem("profileData", JSON.stringify(p));
        loadProfile(); updateDashboard(); alert("Profile Saved!");
    }

    function loadProfile() {
        let d = JSON.parse(localStorage.getItem("profileData"));
        if(d) {
            document.getElementById("profileName").value = d.name || "";
            document.getElementById("profileBaseSalary").value = d.baseSalary || "";
            document.getElementById("profileEmployee").value = d.employee || "";
            document.getElementById("profileCompany").value = d.company || "";
            document.getElementById("profileMobile").value = d.mobile || "";
            document.getElementById("preview").src = d.image || "https://via.placeholder.com/100";
            document.getElementById("dashboardName").innerText = d.name || "Employee";
            document.getElementById("dashboardProfile").src = d.image || "https://via.placeholder.com/50";
        }
    }

    function loadImage(e) { document.getElementById("preview").src = URL.createObjectURL(e.target.files[0]); }

    /* --- EXACT SCREENSHOT FORMAT PDF GENERATION --- */
    async function downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");

        let p = JSON.parse(localStorage.getItem("profileData")) || {};
        let comp = (p.company || "Company Name").toUpperCase();
        let name = p.name || "Host Suraj";
        let id = p.employee || "KISL1024";
        let base = p.baseSalary || "0";
        let bal = document.getElementById("balanceCard").innerText.replace("₹", "Rs. ");
        let otT = document.getElementById("otCard").innerText.replace("₹", "Rs. ");
        let pres = attendanceData.filter(a => a.status === 'Present').length;

        // 1. Blue Banner Header
        doc.setFillColor(15, 23, 42); 
        doc.rect(15, 15, 180, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(comp, 105, 24, { align: "center" });

        // 2. Title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text("Official Salary Report", 15, 45);

        // 3. Summary Box (Rounded)
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(15, 50, 180, 45, 5, 5, 'S');

        doc.setFontSize(11);
        doc.text(`Employee: ${name}`, 20, 60);
        doc.text(`Employee ID: ${id}`, 20, 70);
        doc.text(`Monthly Base Salary: Rs. ${base}`, 20, 80);

        doc.text(`Total Present Days: ${pres}`, 110, 60);
        doc.text(`Total Overtime: ${otT}`, 110, 70);
        
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "bold");
        doc.text(`NET BALANCE: ${bal}`, 110, 80);

        // 4. Table Headers
        doc.setFillColor(15, 23, 42);
        doc.rect(15, 105, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("Date", 20, 111);
        doc.text("Status / Description", 80, 111);
        doc.text("Type", 165, 111);

        // 5. Table Data
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        let y = 115;
        let all = [
            ...attendanceData.map(a => ({d: a.date, s: a.status, t: "Attendance"})),
            ...leaveData.map(l => ({d: l.date, s: l.type, t: "Leave"})),
            ...otData.map(o => ({d: o.date, s: `Rs. ${o.amount} (${o.hours}h)`, t: "Overtime"}))
        ];

        all.forEach(item => {
            doc.setDrawColor(226, 232, 240);
            doc.rect(15, y, 180, 8);
            doc.text(String(item.d), 20, y + 5.5);
            doc.text(String(item.s), 80, y + 5.5);
            doc.text(String(item.t), 165, y + 5.5);
            y += 8;
            if(y > 270) { doc.addPage(); y = 20; }
        });

        doc.save(`${name}_Salary_Report.pdf`);
    }