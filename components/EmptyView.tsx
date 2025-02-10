export const EmptyView = () => {
  return (
    <div className="max-w-[768px] w-full overflow-hidden flex-col gap-5 flex text-md my-16 mx-auto">
      <div className="text-4xl text-center">{"Jarvis"}</div>

      <div className="text-sm max-w-[600px] mx-auto text-center">
        {"Welcome to Jarvis, your AI life coach."}
        <br />
        <br />
        {
          "Ask me anything about your life and I'll help you get to where you want"
        }
        to be.
      </div>
    </div>
  );
};
