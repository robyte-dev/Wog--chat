import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, ShipWheelIcon } from "lucide-react";
import { LANGUAGES } from "../constants";
import AvatarPicker from "../components/AvatarPicker";
import LanguageSelector from "../features/language/LanguageSelector";
import { useLanguage } from "../features/language/useLanguage";

const OnboardingPage = () => {
  const { t } = useLanguage();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic?.startsWith("http") ? authUser.fullName : authUser?.profilePic || authUser?.fullName || Math.random().toString(36).substring(7),
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = (randomSeed) => {
    setFormState((current) => ({ ...current, profilePic: randomSeed }));
    toast.success("New avatar variation generated!");
  };

  return (
    <div className="auth-page-shell" data-theme="night">
      <LanguageSelector className="auth-language-selector" />
      <div className="auth-panel onboarding-panel">
        <aside className="onboarding-intro">
          <div className="onboarding-mark"><ShipWheelIcon aria-hidden="true" /></div>
          <p className="onboarding-eyebrow">{t("onboarding.eyebrow")}</p>
          <h1>{t("onboarding.title")}</h1>
          <p className="onboarding-intro-copy">
            {t("onboarding.description")}
          </p>
          <div className="onboarding-language-note">
            <span className="onboarding-note-icon">↗</span>
            <span>{t("onboarding.languageNote")}</span>
          </div>
        </aside>

        <div className="auth-form-column onboarding-form-column">
          <div className="card bg-transparent shadow-none border-0">
            <div className="card-body p-0">
              <div className="onboarding-brand">
                <div className="onboarding-brand-mark"><ShipWheelIcon aria-hidden="true" /></div>
                <span>WOG</span>
                <span className="onboarding-brand-divider" />
                <span className="onboarding-brand-caption">{t("onboarding.brandCaption")}</span>
              </div>

              <div className="onboarding-form-heading">
                <p>{t("onboarding.sectionEyebrow")}</p>
                <h2>{t("onboarding.sectionTitle")}</h2>
                <span>{t("onboarding.sectionSubtitle")}</span>
              </div>

              <form onSubmit={handleSubmit} className="onboarding-form">
                <AvatarPicker
                  seed={formState.profilePic}
                  onChange={handleRandomAvatar}
                  title={t("onboarding.avatarTitle")}
                  description={t("onboarding.avatarDescription")}
                  actionLabel={t("onboarding.avatarAction")}
                />

                <div className="onboarding-fields">
                  <div className="form-floating">
                    <input
                      id="onboarding-name"
                      type="text"
                      name="fullName"
                      value={formState.fullName}
                      onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                    <label htmlFor="onboarding-name">{t("auth.fullName")}</label>
                  </div>
                  <div className="form-floating onboarding-bio-field">
                    <textarea
                      id="onboarding-bio"
                      name="bio"
                      value={formState.bio}
                      onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                      placeholder="Tell others about yourself"
                      required
                    />
                    <label htmlFor="onboarding-bio">{t("onboarding.bio")}</label>
                  </div>

                  <div className="onboarding-language-fields">
                    <div className="form-floating">
                      <select
                        id="native-language"
                        className="language-choice"
                        name="nativeLanguage"
                        value={formState.nativeLanguage}
                        onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                        required
                      >
                        <option value="" disabled hidden></option>
                        {LANGUAGES.map((lang) => (
                          <option key={`native-${lang}`} value={lang.toLowerCase()}>{lang}</option>
                        ))}
                      </select>
                      <label htmlFor="native-language">{t("onboarding.nativeLanguage")}</label>
                    </div>

                  </div>

                  <div className="form-floating">
                    <input
                      id="onboarding-location"
                      type="text"
                      name="location"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      placeholder="City, Country"
                      required
                    />
                    <label htmlFor="onboarding-location">{t("onboarding.location")}</label>
                  </div>
                </div>

                <button className="auth-cta onboarding-submit btn btn-primary" disabled={isPending} type="submit">
                  {!isPending ? (
                    <>
                      <ShipWheelIcon className="size-5 mr-2" />
                      {t("onboarding.complete")}
                    </>
                  ) : (
                    <>
                      <LoaderIcon className="animate-spin size-5 mr-2" />
                      {t("onboarding.submitting")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
