# Redis keyspace and extremely large, flat datasets
DATE: 1497125115

Redis is a very attractive option for web applications these days - particularly for extremely high transaction, low latency situations where data integrity does not require ACID compliant databases. It's extremely simple setup and huge number of hosting options means it's a great tool for newer developers.

However, dealing with extremely large data sets in memory becomes non-trivial. Under heavy transaction loads and with large amounts of memory, the amount of time redis takes to call `fork()` starts to become painful:

<div class='centered'>
![fork latency](/assets/02/redis_fork_usec.png "Redis fork latency")
</div>

This data is from three production redis 3.2.8 AWS 'r4' instances under load with the 4.4.0-1016-aws kernel. At this point, you'll want to look to Redis Cluster to help shard the memory set.

However, today I wanted to talk a bit about how to design your keyspace, particularly when mapping something simple, like say, [Imgur.com](https://imgur.com) image hashes and their corresponding viewcounts. For example:

<div class='centered'>
![imgur hashes](/assets/02/hash_map_imgur.png "Imgur hash map")
</div>
