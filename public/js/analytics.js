let statusChart = null;
let priorityChart = null;

async function initAnalytics() {
    const data = await getAnalyticsData();
    if (!data) return;

    renderStatusChart(data.status);
    renderPriorityChart(data.priority);
}

function renderStatusChart(statusData) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    // Chuẩn bị dữ liệu
    const labels = ["Pending", "In Progress", "Completed"];
    const counts = [0, 0, 0];
    
    statusData.forEach(item => {
        if (item._id === "pending") counts[0] = item.count;
        if (item._id === "progress") counts[1] = item.count;
        if (item._id === "completed") counts[2] = item.count;
    });

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng Task',
                data: counts,
                backgroundColor: ['#ffc107', '#0d6efd', '#198754'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Trạng thái công việc' }
            }
        }
    });
}

function renderPriorityChart(priorityData) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    const labels = ["Low", "Medium", "High"];
    const counts = [0, 0, 0];
    
    priorityData.forEach(item => {
        if (item._id === "low") counts[0] = item.count;
        if (item._id === "medium") counts[1] = item.count;
        if (item._id === "high") counts[2] = item.count;
    });

    if (priorityChart) priorityChart.destroy();

    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng Task',
                data: counts,
                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                title: { display: true, text: 'Mức độ ưu tiên' }
            }
        }
    });
}
