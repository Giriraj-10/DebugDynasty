import React from "react";
import { useLocation } from "react-router-dom";
import { Activity, ShieldAlert, Award } from "lucide-react";

export const GenericSubpageSkeleton: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop() || "Subpage";
  
  // Format page name to capitalize
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center max-w-2xl mx-auto my-12 space-y-4 page-enter">
      <div className="h-16 w-16 bg-turquoise/10 rounded-2xl flex items-center justify-center mx-auto">
        <Activity className="h-8 w-8 text-stormy-teal animate-pulse" />
      </div>
      <h2 className="text-2xl font-black text-stormy-teal">{title} Workspace</h2>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        This is a placeholder skeleton page for the <strong>{title}</strong> subsection. The core UI layout and navigation are functional, while business logic modules are currently locked.
      </p>
      
      <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <ShieldAlert className="h-4 w-4 text-green-yellow" />
        <span>SKELETON WORKSPACE</span>
        <Award className="h-4 w-4 text-turquoise" />
      </div>
    </div>
  );
};
export default GenericSubpageSkeleton;
