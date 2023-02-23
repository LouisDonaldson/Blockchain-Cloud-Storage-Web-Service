using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Configuration;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace LoadTester
{
    class Program
    {
        static void Main(string[] args)
        {
            
            
        }

        
    }

    class LoadTester
    {
        public LoadTester()
        {
            string server = "150.237.187.44";
            int port = 3000;
            int num_iterations = 5;
            for (int i = 0; i < num_iterations; i++)
            {
                Thread thread = new Thread(() => {
                    Connect(server, port);
                });
            }
        }

        private void Connect(string server, int port)
        {
            TcpClient client = new TcpClient();
            client.Connect(server, port);
            NetworkStream stream = client.GetStream();

            StreamWriter writer = new StreamWriter(stream);
            StreamReader reader = new StreamReader(stream);
            writer.WriteLine('/');
            writer.Flush();
        }


    }
}
