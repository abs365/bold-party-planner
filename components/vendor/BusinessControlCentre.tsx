import { TodaysPrioritiesCard } from "@/components/vendor/TodaysPrioritiesCard";
import { FinalistAlertPanel } from "@/components/vendor/FinalistAlertPanel";
import { BusinessHealthWidget } from "@/components/vendor/BusinessHealthWidget";
import { RevenuePanel } from "@/components/vendor/RevenuePanel";
import { MarketplaceActivityPanel } from "@/components/vendor/MarketplaceActivityPanel";
import { BusinessOperationsPanel } from "@/components/vendor/BusinessOperationsPanel";
import { DailyHighestImpactActionCard } from "@/components/vendor/DailyHighestImpactActionCard";
import type { BusinessControlCentreData, BusinessHealthScore } from "@/lib/vendor/business-control-centre";

interface Props {
  controlCentreData: BusinessControlCentreData;
  healthScore: BusinessHealthScore;
}

// Section order is deliberate — see BUSINESS_CONTROL_CENTRE_FINAL_ARCHITECTURE.md §1.1:
// Today's Priorities -> Business Health -> Revenue -> Marketplace Activity ->
// Business Operations -> Daily Highest-Impact Action (always last, always exactly one).
export function BusinessControlCentre({ controlCentreData, healthScore }: Props) {
  return (
    <section aria-label="Business Control Centre" className="space-y-3 mb-8">
      <TodaysPrioritiesCard priority={controlCentreData.priority} />
      <FinalistAlertPanel shortlisted={controlCentreData.shortlisted} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BusinessHealthWidget healthScore={healthScore} />
        <RevenuePanel revenue={controlCentreData.revenue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <MarketplaceActivityPanel marketplaceActivity={controlCentreData.marketplaceActivity} />
        <BusinessOperationsPanel businessOperations={controlCentreData.businessOperations} />
      </div>

      <DailyHighestImpactActionCard action={controlCentreData.dailyHighestImpactAction} />

      <hr className="border-white/6 mt-6 mb-2" />
    </section>
  );
}
