export const EmptyView = () => {
  return (
    <div className="max-w-[768px] w-full overflow-hidden flex-col gap-5 flex text-md my-16 mx-auto">
      <div className="text-4xl text-center">{"Jarvis"}</div>

      <div className="text-sm max-w-[600px] mx-auto text-center flex flex-col gap-2">
        <p>{"Welcome to Jarvis, your AI math tutor."}</p>
        <p>
          {
            "Ask me anything about math and I'll help you to find out more about it"
          }
        </p>
      </div>
    </div>
  );
};
