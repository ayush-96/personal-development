# Window Functions TL;DR

## Rank vs Dense_Rank vs Row_Number
```python
from pyspark.sql.functions import *

window = Window.partitionBy("dept").orderBy(desc("salary"))

df.withColumn("rank", rank().over(window))
  .withColumn("dense_rank", dense_rank().over(window))
  .withColumn("row_num", row_number().over(window))
