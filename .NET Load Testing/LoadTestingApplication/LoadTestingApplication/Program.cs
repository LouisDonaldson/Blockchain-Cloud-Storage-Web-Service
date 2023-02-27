using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace LoadTestingApplication
{
    internal class Program
    {
        static void Main(string[] args)
        {
            new LoadTester();
        }
    }

    class LoadTester
    {
        static readonly HttpClient client = new HttpClient();
        string server_addr;
        int port;

        public LoadTester()
        {
            server_addr = "127.0.0.1";
            port = 3000;
            int num_iterations = 50;
            for (int i = 0; i < num_iterations; i++)
            {
                Thread thread = new Thread(new ThreadStart(async () =>
                {
                    await MakeRequest("/", default);

                }));
                thread.Start();




            }
            Console.WriteLine("\nPress any key...");
            Console.ReadKey();

        }

        async Task MakeRequest(string url, string[,] headers)
        {
            Thread.Sleep(50);
            // Call asynchronous network methods in a try/catch block to handle exceptions.
            try
            {
                HttpResponseMessage response = await client.GetAsync($"http://{server_addr}:{port}{url}");
                response.EnsureSuccessStatusCode();
                string responseBody = await response.Content.ReadAsStringAsync();
                // Above three lines can be replaced with new helper method below
                // string responseBody = await client.GetStringAsync(uri);

                Console.WriteLine(responseBody);
            }
            catch (HttpRequestException e)
            {
                Console.WriteLine("\nException Caught!");
                Console.WriteLine("Message :{0} ", e.Message);
            }

        }

        private void Connect(string server, int port)
        {
            Console.WriteLine("Thread created");

            TcpClient client = new TcpClient();
            client.Connect(server, port);
            NetworkStream stream = client.GetStream();

            StreamWriter writer = new StreamWriter(stream);
            StreamReader reader = new StreamReader(stream);
            writer.WriteLine($"GET / HTTP/1.1");
            writer.Flush();

            //string response = reader.ReadToEnd();
            //Console.WriteLine(response);

            //string html = string.Empty;
            //string url = @"https://localhost:3000/";

            //HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            //request.AutomaticDecompression = DecompressionMethods.GZip;

            //using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            //using (Stream stream = response.GetResponseStream())
            //using (StreamReader reader = new StreamReader(stream))
            //{
            //    html = reader.ReadToEnd();
            //}

            //Console.WriteLine(html);
        }


    }
}
