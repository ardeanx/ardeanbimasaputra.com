import { Clock } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { getT } from "@/lib/i18n";

export default async function ComingSoon({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactNode;
}) {
  const t = await getT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState icon={icon ?? <Clock />} title={title} description={t("comingSoon.body")} />
    </div>
  );
}
