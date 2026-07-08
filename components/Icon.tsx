import {
  Database,
  BrainCircuit,
  Bot,
  MessageSquare,
  PieChart,
  LineChart,
  Zap,
  ShieldCheck,
  Compass,
  Target,
  Check,
  CheckCircle,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Registry ánh xạ tên icon kebab-case (trong dữ liệu JSON) -> component Lucide.
 * Thay cho cách dùng <i data-lucide> + CDN ở bản Vanilla. SSR được, tree-shake tốt.
 * Thêm icon mới: bổ sung import + một dòng vào registry.
 */
const REGISTRY: Record<string, LucideIcon> = {
  database: Database,
  "brain-circuit": BrainCircuit,
  bot: Bot,
  "message-square": MessageSquare,
  "pie-chart": PieChart,
  "line-chart": LineChart,
  zap: Zap,
  "shield-check": ShieldCheck,
  compass: Compass,
  target: Target,
  check: Check,
  "check-circle": CheckCircle,
};

export default function Icon({
  name,
  size = 24,
  className,
  color,
}: {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}) {
  const Cmp = REGISTRY[name] ?? HelpCircle;
  return (
    <Cmp size={size} className={className} color={color} strokeWidth={1.5} />
  );
}
