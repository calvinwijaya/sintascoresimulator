// --- DATABASE SKOR SINTA & EFFORT POINT ---
// Struktur: { jenis: { kategori: { peran: [skor_sinta, effort_point] } } }
const db = {
    jurnal_int: {
        q1: { single: [40, 20], first: [24, 20], member: [16, 20] },
        q2: { single: [40, 15], first: [22, 15], member: [14, 15] },
        q3: { single: [40, 10], first: [20, 10], member: [12, 10] },
        q4: { single: [40, 8],  first: [18, 8],  member: [10, 8] }
    },
    jurnal_nas: {
        s1: { single: [25, 7], first: [15, 7], member: [10, 7] },
        s2: { single: [25, 7], first: [15, 7], member: [10, 7] },
        s3: { single: [20, 4], first: [12, 4], member: [8, 4] },
        s4: { single: [20, 4], first: [12, 4], member: [8, 4] },
        s5: { single: [15, 2], first: [9, 2],  member: [6, 2] },
        s6: { single: [15, 2], first: [9, 2],  member: [6, 2] },
        non_akreditasi: { single: [10, 1.5], first: [6, 1.5], member: [4, 1.5] }
    },
    prosiding: {
        internasional: { single: [30, 4], first: [18, 4], member: [12, 4] },
        nasional: { single: [10, 1], first: [6, 1], member: [4, 1] } 
    }
};

let chartInstance = null;

function getCategoryOptions(type) {
    if (type === 'jurnal_int') return `<option value="q1">Scopus Q1</option><option value="q2">Scopus Q2</option><option value="q3">Scopus Q3</option><option value="q4">Scopus Q4</option>`;
    if (type === 'jurnal_nas') return `<option value="s1">Sinta 1</option><option value="s2">Sinta 2</option><option value="s3">Sinta 3</option><option value="s4">Sinta 4</option><option value="s5">Sinta 5</option><option value="s6">Sinta 6</option>`;
    if (type === 'prosiding') return `<option value="internasional">Internasional</option><option value="nasional">Nasional</option>`;
}

function updateCategory(selectElement) {
    const type = selectElement.value;
    const catSelect = selectElement.closest('tr').querySelector('.cat-select');
    catSelect.innerHTML = getCategoryOptions(type);
}

function addRow() {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <select class="form-select type-select" onchange="updateCategory(this)">
                <option value="jurnal_int">Jurnal Internasional</option>
                <option value="jurnal_nas">Jurnal Nasional</option>
                <option value="prosiding">Prosiding</option>
            </select>
        </td>
        <td>
            <select class="form-select cat-select">
                <option value="q1">Scopus Q1</option>
                <option value="q2">Scopus Q2</option>
                <option value="q3">Scopus Q3</option>
                <option value="q4">Scopus Q4</option>
            </select>
        </td>
        <td>
            <select class="form-select role-select">
                <option value="single">Single Author</option>
                <option value="first">First Author</option>
                <option value="member">Member Author</option>
            </select>
        </td>
        <td><button class="btn btn-outline-danger btn-sm" onclick="removeRow(this)">Hapus</button></td>
    `;
    tbody.appendChild(tr);
}

function removeRow(btn) {
    const tr = btn.closest('tr');
    if(document.querySelectorAll('#tableBody tr').length > 1) {
        tr.remove();
    } else {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Minimal harus ada 1 baris rencana!' });
    }
}

// Fitur Card 1: Kalkulasi Manual Row-by-Row
function calculateSimulation() {
    const rows = document.querySelectorAll('#tableBody tr');
    let totalScore = 0;
    let totalEffort = 0;

    rows.forEach(row => {
        const type = row.querySelector('.type-select').value;
        const cat = row.querySelector('.cat-select').value;
        const role = row.querySelector('.role-select').value;

        if(db[type] && db[type][cat] && db[type][cat][role]) {
            totalScore += db[type][cat][role][0];
            totalEffort += db[type][cat][role][1];
        }
    });

    if(totalScore === 0) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Kombinasi belum ada di database simulasi.' });
        return;
    }

    document.getElementById('resultContainer').style.display = 'block';
    document.getElementById('totalScoreText').innerText = totalScore;
    document.getElementById('totalEffortText').innerText = totalEffort;

    // Logika Rekomendasi Efisiensi: Membandingkan dengan kombinasi Sinta 3 & Prosiding Nasional
    let s3_count = Math.floor(totalScore / 12);
    let s3_rem = totalScore % 12;
    let pros_count = Math.ceil(s3_rem / 6);
    
    let newEffort = (s3_count * 4) + (pros_count * 1);
    let newScore = (s3_count * 12) + (pros_count * 6);

    let recText = "";
    let optEffort = totalEffort;

    if (newEffort < totalEffort) {
        recText = `Untuk mencapai skor <b>~${newScore}</b>, Anda akan menghemat <b>${(totalEffort - newEffort)} poin beban kerja (effort)</b> apabila memecah target menjadi:<br><br>
                   • <b>${s3_count}x</b> Jurnal Nasional (Sinta 3, First Author)<br>
                   • <b>${pros_count}x</b> Prosiding Nasional (First Author)<br><br>
                   Fokus pada jurnal menengah terakreditasi dan prosiding lokal terbukti lebih rasional secara waktu dan probabilitas <i>acceptance</i> dibandingkan memaksakan jurnal internasional berat.`;
        optEffort = newEffort;
    } else {
        recText = `Rencana publikasi Anda saat ini sudah sangat optimal dari segi perbandingan Skor berbanding Beban Kerja. Strategi yang bagus!`;
    }

    document.getElementById('recommendationText').innerHTML = recText;
    renderChart(totalScore, totalEffort, newScore >= totalScore ? newScore : totalScore, optEffort);
    document.getElementById('resultContainer').scrollIntoView({ behavior: 'smooth' });
}

// Fitur Card 2: Kalkulator Target Instan
function calculateTargetOptimizer() {
    const target = parseInt(document.getElementById('targetScoreInput').value);
    
    if (isNaN(target) || target <= 0) {
        Swal.fire({ icon: 'error', title: 'Invalid', text: 'Masukkan angka target skor yang valid.' });
        return;
    }

    // Jalur Realistis (Rasio Efisiensi Tinggi): Sinta 3 (First, Skor 12, Eff 4) + Pros Nas (First, Skor 6, Eff 1)
    let s3_count = Math.floor(target / 12);
    let rem = target % 12;
    let pros_count = Math.ceil(rem / 6);
    
    let eff_score = (s3_count * 12) + (pros_count * 6);
    let eff_effort = (s3_count * 4) + (pros_count * 1);

    // Jalur Prestise Internasional: Scopus Q4 (First, Skor 18, Eff 8) + Pros Nas (First, Skor 6, Eff 1)
    let q4_count = Math.floor(target / 18);
    let rem_q4 = target % 18;
    let pros_q4_count = Math.ceil(rem_q4 / 6);
    
    let pres_score = (q4_count * 18) + (pros_q4_count * 6);
    let pres_effort = (q4_count * 8) + (pros_q4_count * 1);

    const resultBox = document.getElementById('targetResultBox');
    resultBox.style.display = 'block';
    
    resultBox.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <div class="p-3 bg-white rounded border border-success h-100 shadow-sm">
                    <h6 class="text-success fw-bold"><i class="bi bi-lightning-charge"></i> Jalur Realistis Efisien</h6>
                    <p class="text-muted small mb-2">Beban Kerja Total: <b>${eff_effort} poin</b> | Prediksi Skor: <b>${eff_score}</b></p>
                    <ul class="mb-0 small">
                        ${s3_count > 0 ? `<li><b>${s3_count}x</b> Jurnal Nasional Sinta 3 (First Author)</li>` : ''}
                        ${pros_count > 0 ? `<li><b>${pros_count}x</b> Prosiding Nasional (First Author)</li>` : ''}
                    </ul>
                </div>
            </div>
            ${q4_count > 0 ? `
            <div class="col-md-6">
                <div class="p-3 bg-white rounded border border-info h-100 shadow-sm">
                    <h6 class="text-info fw-bold"><i class="bi bi-globe"></i> Jalur Prestise Internasional</h6>
                    <p class="text-muted small mb-2">Beban Kerja Total: <b>${pres_effort} poin</b> | Prediksi Skor: <b>${pres_score}</b></p>
                    <ul class="mb-0 small">
                        <li><b>${q4_count}x</b> Jurnal Scopus Q4 (First Author)</li>
                        ${pros_q4_count > 0 ? `<li><b>${pros_q4_count}x</b> Prosiding Nasional (First Author)</li>` : ''}
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function renderChart(score1, effort1, score2, effort2) {
    const ctx = document.getElementById('efficiencyChart').getContext('2d');
    if(chartInstance) { chartInstance.destroy(); }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Rencana Anda', 'Rekomendasi Sistem'],
            datasets: [
                {
                    label: 'SINTA Score (Target)',
                    data: [score1, score2],
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Effort Point (Beban Kerja)',
                    data: [effort1, effort2],
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}