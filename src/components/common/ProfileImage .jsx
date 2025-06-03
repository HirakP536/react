const ProfileImage = ({ name, classNameProperty = "" }) => {
  const nameParts = name.split(" ");
  const firstNameInitial = nameParts[0] ? nameParts[0][0] : "";
  const lastNameInitial = nameParts[1] ? nameParts[1][0] : "";

  // Use provided classNameProperty or default to !text-white
  const textColorClass =
    classNameProperty && classNameProperty.trim() !== ""
      ? classNameProperty
      : "!text-white";

  return (
    <span
      className={`flex text-sm bg-secondary rounded-full w-8 h-8 items-center justify-center uppercase ${textColorClass}`}
    >
      {firstNameInitial}
      {lastNameInitial}
    </span>
  );
};

export default ProfileImage;
