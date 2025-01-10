const Home = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <div className="flex flex-col gap-4 py-4">
        <a href="/login" className="underline text-orange-500">
          Login Page
        </a>
        <a href="/contact" className="underline text-purple-500">
          Contact Page
        </a>
      </div>
    </div>
  );
};
export default Home;
