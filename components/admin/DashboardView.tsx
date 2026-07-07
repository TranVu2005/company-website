import type { AdminViewServerProps } from "payload";
import { getDashboardMetrics, type DashboardMetrics, type DashboardRange } from "@/lib/dashboard";

const RANGE_LABELS: Record<DashboardRange, string> = {
  today: "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
};

const RANGES: DashboardRange[] = ["today", "7d", "30d"];

function formatCurrency(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function TrendChart({ dailyTrend }: { dailyTrend: DashboardMetrics["dailyTrend"] }) {
  const width = 600;
  const height = 160;
  const barGap = 4;
  const barWidth = (width - barGap * (dailyTrend.length - 1)) / dailyTrend.length;
  const maxTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, background: "#f8fafc" }}>
      {dailyTrend.map((point, index) => {
        const barHeight = (point.total / maxTotal) * (height - 24);
        const x = index * (barWidth + barGap);
        const y = height - 24 - barHeight;
        return (
          <g key={point.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="#2563eb" />
            <title>{`${point.date}: ${formatCurrency(point.total)}`}</title>
            <text x={x + barWidth / 2} y={height - 8} fontSize={9} textAnchor="middle" fill="#475569">
              {point.date.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export async function DashboardView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;

  // Phòng thủ thêm dù khung /admin đã chặn non-"users" truy cập.
  if (req.user?.collection !== "users") {
    return <div style={{ padding: 24 }}>Không có quyền truy cập.</div>;
  }

  const rangeParam = typeof searchParams?.range === "string" ? searchParams.range : undefined;
  const metrics = await getDashboardMetrics(req.payload, rangeParam);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard — Đơn hàng &amp; Doanh thu</h1>

      <div style={{ margin: "12px 0" }}>
        {RANGES.map((r, i) => (
          <span key={r}>
            {i > 0 ? " · " : ""}
            {metrics.range === r ? (
              <strong>{RANGE_LABELS[r]}</strong>
            ) : (
              <a href={`/admin/dashboard?range=${r}`}>{RANGE_LABELS[r]}</a>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, margin: "16px 0" }}>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Doanh thu</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Số đơn</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{metrics.orderCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Giá trị đơn trung bình</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.averageOrderValue)}</div>
        </div>
      </div>

      {metrics.dailyTrend.length > 1 ? (
        <section style={{ margin: "16px 0" }}>
          <h2>Xu hướng doanh thu theo ngày</h2>
          <TrendChart dailyTrend={metrics.dailyTrend} />
        </section>
      ) : null}

      <section>
        <h2>Top 5 sản phẩm bán chạy</h2>
        {metrics.topProducts.length === 0 ? (
          <p>Chưa có dữ liệu.</p>
        ) : (
          <table style={{ width: "100%", maxWidth: 500, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Sản phẩm</th>
                <th style={{ textAlign: "right" }}>Số lượng bán</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topProducts.map((p) => (
                <tr key={p.productId}>
                  <td>{p.productName}</td>
                  <td style={{ textAlign: "right" }}>{p.quantitySold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
