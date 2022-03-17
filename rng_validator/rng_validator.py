from lxml import etree
import sys
from io import StringIO 
from pathlib import Path

if (len(sys.argv) != 3):
  raise Exception("Usage: program [raw RNG validation file] [raw TBX file to be validated]")

rawTbxFile = Path(sys.argv[2]).read_text().encode("utf8")
relaxNGValidator = etree.RelaxNG(etree.fromstring(sys.argv[1].encode("utf8")))
validationResult = relaxNGValidator.assertValid(etree.fromstring(rawTbxFile))

sys.exit(0)

