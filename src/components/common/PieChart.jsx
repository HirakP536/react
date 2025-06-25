import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ title, labels, data }) => {
const statusColors = {
  "ANSWERED": "#16610E",
  "MISSED": "#E55050",
  "FAILED": "#9e1c1c",
  "BUSY": "#ffc107",
  "NO ANSWER": "#B2C6D5"
};
  const chartConfig = {
    labels: labels,
    datasets: [
      {
        label: labels,
        data: data,
        backgroundColor: labels.map(label => statusColors[label]),
        borderWidth: 0,
      },
    ],
    options: {
      responsive: true,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc, data) => acc + data, 0);
              const percentage =
                total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  };
  return (
    <div className="flex flex-col items-center justify-center w-full p-4">
      <h5>{title}</h5>{" "}
      <div className="sm:max-w-[600px] max-w-[250px] sm:max-h-[600px] max-h-[250px]  mx-auto">
        <Doughnut data={chartConfig} options={chartConfig.options} />
      </div>
    </div>
  );
};

export default PieChart;
